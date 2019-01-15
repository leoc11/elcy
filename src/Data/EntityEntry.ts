import { DbSet } from "./DbSet";
import { IChangeEventParam, IRelationChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { EntityState } from "./EntityState";
import { IEntityEntryOption } from "./Interface/IEntityEntry";
import { RelationEntry } from "./RelationEntry";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { EmbeddedRelationMetaData } from "../MetaData/EmbeddedColumnMetaData";
import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventHandler } from "../Event/IEventHandler";
import { propertyChangeHandlerMetaKey, propertyChangeDispatherMetaKey, relationChangeHandlerMetaKey, relationChangeDispatherMetaKey } from "../Decorator/DecoratorKey";
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";

let embeddedEntityEntry: typeof EmbeddedEntityEntry;
(async () => {
    embeddedEntityEntry = (await import("./EmbeddedEntityEntry")).EmbeddedEntityEntry;
})();

export class EntityEntry<T = any> implements IEntityEntryOption<T> {
    public state: EntityState;
    public enableTrackChanges = true;
    public get metaData(): EntityMetaData<T> {
        return this.dbSet.metaData;
    }
    public relationMap: { [relationName: string]: Map<EntityEntry, RelationEntry<T, any> | RelationEntry<any, T>> } = {};
    constructor(public readonly dbSet: DbSet<T>, public entity: T, public key: string) {
        this.state = EntityState.Unchanged;

        let propertyChangeHandler: IEventHandler<T, IChangeEventParam<T>> = (entity as any)[propertyChangeHandlerMetaKey];
        if (!propertyChangeHandler) {
            let propertyChangeDispatcher: any;
            [propertyChangeHandler, propertyChangeDispatcher] = EventHandlerFactory<T, IChangeEventParam<T>>(entity);
            (entity as any)[propertyChangeHandlerMetaKey] = propertyChangeHandler;
            (entity as any)[propertyChangeDispatherMetaKey] = propertyChangeDispatcher;
        }
        propertyChangeHandler.add((source: T, args: IChangeEventParam) => this.onPropertyChanged(source, args));

        let relationChangeHandler: IEventHandler<T, IRelationChangeEventParam> = (entity as any)[relationChangeHandlerMetaKey];
        if (!relationChangeHandler) {
            let relationChangeDispatcher: any;
            [relationChangeHandler, relationChangeDispatcher] = EventHandlerFactory<T, IRelationChangeEventParam>(entity);
            (entity as any)[relationChangeHandlerMetaKey] = relationChangeHandler;
            (entity as any)[relationChangeDispatherMetaKey] = relationChangeDispatcher;
        }
        relationChangeHandler.add((source: T, args: IRelationChangeEventParam) => this.onRelationChanged(source, args));
    }
    public get isCompletelyLoaded() {
        return this.dbSet.metaData.columns.all(o => (this.entity as any)[o.propertyName] !== undefined);
    }
    private originalValues: Map<keyof T, any> = new Map();
    public isPropertyModified(prop: keyof T) {
        return this.originalValues.has(prop);
    }
    public getOriginalValue(prop: keyof T) {
        return this.originalValues.get(prop);
    }
    protected onPropertyChanged(entity: T, param: IChangeEventParam<T>) {
        if (this.dbSet.primaryKeys.contains(param.column)) {
            // primary key changed, update dbset entry dictionary.
            const oldKey = this.key;
            this.dbSet.updateEntryKey(this);

            // TODO: cascade update issue
            // update all relation refer to this entity.
            for (const prop in this.relationMap) {
                const relationGroup = this.relationMap[prop];
                if (!relationGroup)
                    continue;

                for (const [, relation] of relationGroup) {
                    const entry = relation.masterEntry === this ? relation.slaveEntry : relation.masterEntry;
                    entry.updateRelationKey(relation, oldKey);
                }
            }
        }

        if (param.oldValue !== param.newValue && param.column instanceof EmbeddedRelationMetaData) {
            const embeddedDbSet = this.dbSet.dbContext.set(param.column.target.type);
            new embeddedEntityEntry(embeddedDbSet, param.newValue, this);
        }

        if (this.enableTrackChanges && (this.state === EntityState.Modified || this.state === EntityState.Unchanged) && param.oldValue !== param.newValue) {
            const oriValue = this.originalValues.get(param.column.propertyName);
            if (oriValue === param.newValue) {
                this.originalValues.delete(param.column.propertyName);
                if (this.originalValues.size <= 0) {
                    this.changeState(EntityState.Unchanged);
                }
            }
            else if (oriValue === undefined && param.oldValue !== undefined && !param.column.isReadOnly) {
                this.originalValues.set(param.column.propertyName, param.oldValue);
                if (this.state === EntityState.Unchanged) {
                    this.changeState(EntityState.Modified);
                }
            }
        }
    }
    protected onRelationChanged(entity: T, param: IRelationChangeEventParam) {
        if (!this.enableTrackChanges)
            return;
        for (const item of param.entities) {
            const entry = this.dbSet.dbContext.entry(item);
            let relationGroup = this.relationMap[param.relation.fullName];
            if (!relationGroup) {
                relationGroup = new Map();
                this.relationMap[param.relation.fullName] = relationGroup;
            }
            let relationEntry = relationGroup.get(entry);
            if (!relationEntry) {
                relationEntry = param.relation.isMaster ? new RelationEntry(entry, this, param.relation.reverseRelation) : new RelationEntry(this, entry, param.relation);
                relationGroup.set(entry, relationEntry);
                entry.registerRelation(relationEntry);
            }
            let state = EntityState.Unchanged;
            switch (param.type) {
                case "add":
                    state = EntityState.Added;
                    break;
                case "del":
                    state = EntityState.Deleted;
                    break;
            }
            this.dbSet.dbContext.changeRelationState(relationEntry, state);
        }
    }
    public registerRelation(relationEntry: RelationEntry<T, any> | RelationEntry<any, T>) {
        const isMaster = relationEntry.masterEntry === this;
        const key = isMaster ? relationEntry.slaveEntry : relationEntry.masterEntry;
        let relGroup = this.relationMap[relationEntry.slaveRelation.fullName];
        if (!relGroup) {
            relGroup = new Map();
            this.relationMap[relationEntry.slaveRelation.fullName] = relGroup;
        }

        const reverseRelation = isMaster ? relationEntry.slaveRelation.reverseRelation : relationEntry.slaveRelation;
        const reverseEntry = isMaster ? relationEntry.masterEntry : relationEntry.slaveEntry;
        if (reverseRelation.relationType === "one")
            reverseEntry.entity[reverseRelation.propertyName] = key.entity;
        else {
            let relationVal: any[] = reverseEntry.entity[reverseRelation.propertyName];
            if (!Array.isArray(relationVal)) {
                relationVal = [];
                reverseEntry.entity[reverseRelation.propertyName] = relationVal;
            }
            relationVal.add(key.entity);
        }

        relGroup.set(key, relationEntry);
    }
    public getRelation(relationName: string, relatedEntry: EntityEntry) {
        const relGroup = this.relationMap[relationName];
        return relGroup ? relGroup.get(relatedEntry) : null;
    }
    public removeRelation(relationEntry: RelationEntry<T, any> | RelationEntry<any, T>) {
        const key = (relationEntry.masterEntry === this ? relationEntry.slaveEntry : relationEntry.masterEntry);
        let relGroup = this.relationMap[relationEntry.slaveRelation.fullName];
        if (relGroup) {
            relGroup.delete(key);
        }
    }
    protected updateRelationKey(relationEntry: RelationEntry<T, any> | RelationEntry<any, T>, oldEntityKey: string) {
        const oldKey = relationEntry.slaveRelation.fullName + ":" + oldEntityKey;
        this.relationMap[oldKey] = undefined;
        this.registerRelation(relationEntry);
    }
    public resetChanges(...properties: Array<keyof T>) {
        if (properties) {
            for (const prop of properties) {
                if (this.originalValues.has(prop))
                    (this.entity as any)[prop] = this.originalValues.get(prop);
            }
        }
        else {
            for (const [prop, value] of this.originalValues) {
                if (!properties || properties.contains(prop))
                    (this.entity as any)[prop] = value;
            }
        }
    }
    public acceptChanges(...properties: Array<keyof T>) {
        if (properties && this.state !== EntityState.Modified)
            return;

        switch (this.state) {
            case EntityState.Modified: {
                let acceptedProperties: Array<keyof T> = [];
                if (properties) {
                    for (const prop of properties) {
                        const isDeleted = this.originalValues.delete(prop);
                        if (isDeleted)
                            acceptedProperties.push(prop);
                    }
                }
                else {
                    acceptedProperties = this.originalValues.asEnumerable().select(o => o[0]).toArray();
                    this.originalValues.clear();
                }

                acceptedProperties.intersect(this.metaData.primaryKeys.select(o => o.propertyName))
                    .each(prop => {
                        // reflect update option
                        this.metaData.relations
                            .where(o => o.isMaster && o.relationColumns.any(o => o.propertyName === prop)
                                && (o.updateOption === "CASCADE" || o.updateOption === "SET NULL" || o.updateOption === "SET DEFAULT")
                                && this.relationMap[o.fullName] !== undefined
                            )
                            .each(o => {
                                const col = o.relationColumns.first(o => o.propertyName === prop);
                                const rCol = o.relationMaps.get(col);
                                const relationData = this.relationMap[o.fullName];
                                if (relationData) {
                                    relationData.asEnumerable().select(o => o[1])
                                        .each(relEntry => {
                                            switch (o.updateOption) {
                                                case "CASCADE": {
                                                    (relEntry.slaveEntry as any)[rCol.propertyName] = this.entity[prop as keyof T];
                                                    break;
                                                }
                                                case "SET NULL": {
                                                    (relEntry.slaveEntry as any)[rCol.propertyName] = null;
                                                    break;
                                                }
                                                case "SET DEFAULT": {
                                                    (relEntry.slaveEntry as any)[rCol.propertyName] = rCol.default.execute();
                                                    break;
                                                }
                                            }
                                        });
                                }
                            });
                    });

                if (this.originalValues.size <= 0) {
                    this.changeState(EntityState.Unchanged);
                }
                break;
            }
            case EntityState.Deleted: {
                this.changeState(EntityState.Unchanged);

                for (const relMeta of this.dbSet.metaData.relations) {
                    let relEntities: any[] = [];
                    const relProp = this.entity[relMeta.propertyName];
                    if (Array.isArray(relProp))
                        relEntities = relEntities.concat(this.entity[relMeta.propertyName]);
                    else if (relProp)
                        relEntities = [relProp];
                    if (relMeta.reverseRelation.relationType === "one") {
                        relEntities.forEach(o => o[relMeta.reverseRelation.propertyName] = null);
                    }
                    else {
                        relEntities.forEach(o => o[relMeta.reverseRelation.propertyName].delete(this.entity));
                    }

                    // apply delete option
                    this.metaData.relations
                        .where(o => o.isMaster && this.relationMap[o.fullName] !== undefined
                            && (o.updateOption === "CASCADE" || o.updateOption === "SET NULL" || o.updateOption === "SET DEFAULT")
                        )
                        .each(o => {
                            const relEntryMap = this.relationMap[o.fullName];
                            if (relEntryMap) {
                                relEntryMap.asEnumerable().select(o => o[1])
                                    .each(relEntry => {
                                        switch (o.updateOption) {
                                            case "CASCADE": {
                                                relEntry.slaveEntry.state = EntityState.Deleted;
                                                (relEntry.slaveEntry as EntityEntry).acceptChanges();
                                                break;
                                            }
                                            case "SET NULL": {
                                                (relEntry.slaveRelation as IRelationMetaData<any, T>).mappedRelationColumns.each(rCol => {
                                                    (relEntry.slaveEntry as any)[rCol.propertyName] = null;
                                                    (relEntry.slaveEntry as EntityEntry).acceptChanges(rCol.propertyName);
                                                });
                                                break;
                                            }
                                            case "SET DEFAULT": {
                                                (relEntry.slaveRelation as IRelationMetaData<any, T>).mappedRelationColumns.each(rCol => {
                                                    if (rCol.default) {
                                                        (relEntry.slaveEntry as any)[rCol.propertyName] = rCol.default.execute();
                                                        (relEntry.slaveEntry as EntityEntry).acceptChanges(rCol.propertyName);
                                                    }
                                                });
                                                break;
                                            }
                                        }
                                    });
                            }
                        });
                }
                break;
            }
        }
    }
    public setOriginalValues(originalValues: { [key: string]: any }) {
        for (const prop in originalValues) {
            const value = originalValues[prop];
            this.setOriginalValue(prop as any, value);
        }
        this.changeState(this.originalValues.size > 0 ? EntityState.Modified : EntityState.Unchanged);
    }
    public changeState(state: EntityState) {
        this.dbSet.dbContext.changeState(this, state);
    }
    public setOriginalValue(property: keyof T, value: any) {
        if (!(property in this.entity))
            return;
        if (this.entity[property] === value)
            this.originalValues.delete(property);
        else if (this.isPropertyModified(property)) {
            this.originalValues.set(property, value);
        }
        else {
            this.enableTrackChanges = false;
            this.entity[property] = value;
            this.enableTrackChanges = true;
        }
    }
    public getModifiedProperties() {
        return Array.from(this.originalValues.keys());
    }

    public getPrimaryValues() {
        const res: any = {};
        this.dbSet.primaryKeys.each(o => {
            res[o.propertyName] = this.entity[o.propertyName];
        });
        return res;
    }

    //#region asd

    /**
     * Reloads the entity from the database overwriting any property values with values from the database.
     * For modified properties, then the original value will be overwrite with vallue from the database.
     * Note: To clean entity from database, call resetChanges after reload.
     */
    public async reload() {
        await this.dbSet.find(this.getPrimaryValues(), true);
    }
    /**
     * Load relation to this entity.
     */
    public async loadRelation(...relations: ((entity: T) => any)[]) {
        const paramExp = new ParameterExpression("o", this.dbSet.type);
        const projected = this.dbSet.primaryKeys.select(o => new FunctionExpression(new MemberAccessExpression(paramExp, o.propertyName), [paramExp])).toArray();
        await this.dbSet.project(...(projected as any[])).include(...relations).find(this.getPrimaryValues());
    }

    //#endregion
}
