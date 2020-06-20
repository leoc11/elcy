import { FlatObjectLike, KeysExceptType, KeysType, ValueType } from "../Common/Type";
import { propertyChangeDispatherMetaKey, propertyChangeHandlerMetaKey, relationChangeDispatherMetaKey, relationChangeHandlerMetaKey } from "../Decorator/DecoratorKey";
import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventHandler } from "../Event/IEventHandler";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { ComputedColumnMetaData } from "../MetaData/ComputedColumnMetaData";
import { EmbeddedRelationMetaData } from "../MetaData/EmbeddedColumnMetaData";
import { IChangeEventParam, IRelationChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { DbSet } from "./DbSet";
import { EntityState } from "./EntityState";
import { IEntityEntry } from "./Interface/IEntityEntry";
import { RelationEntry } from "./RelationEntry";
import { RelationState } from "./RelationState";

export class EntityEntry<T = any> implements IEntityEntry<T> {
    public get isCompletelyLoaded() {
        return this.dbSet.metaData.columns.where((o) => !(o instanceof ComputedColumnMetaData))
            .all((o) => this.entity[o.propertyName] !== undefined);
    }
    public get metaData(): IEntityMetaData<T> {
        return this.dbSet.metaData;
    }
    public get state() {
        return this._state;
    }
    public set state(value) {
        if (this._state !== value) {
            const dbContext = this.dbSet.dbContext;
            switch (this.state) {
                case EntityState.Added: {
                    const typedAddEntries = dbContext.entityEntries.add.get(this.metaData);
                    if (typedAddEntries) {
                        typedAddEntries.delete(this);
                    }
                    break;
                }
                case EntityState.Deleted: {
                    const typedEntries = dbContext.entityEntries.delete.get(this.metaData);
                    if (typedEntries) {
                        typedEntries.delete(this);
                    }
                    break;
                }
                case EntityState.Modified: {
                    const typedEntries = dbContext.entityEntries.update.get(this.metaData);
                    if (typedEntries) {
                        typedEntries.delete(this);
                    }
                    break;
                }
                case EntityState.Detached: {
                    // load all relation
                    break;
                }
            }
            switch (value) {
                case EntityState.Added: {
                    let typedEntries = dbContext.entityEntries.add.get(this.metaData);
                    if (!typedEntries) {
                        typedEntries = [];
                        dbContext.entityEntries.add.set(this.metaData, typedEntries);
                    }
                    typedEntries.push(this);
                    break;
                }
                case EntityState.Deleted: {
                    let typedEntries = dbContext.entityEntries.delete.get(this.metaData);
                    if (!typedEntries) {
                        typedEntries = [];
                        dbContext.entityEntries.delete.set(this.metaData, typedEntries);
                    }
                    typedEntries.push(this);
                    break;
                }
                case EntityState.Modified: {
                    let typedEntries = dbContext.entityEntries.update.get(this.metaData);
                    if (!typedEntries) {
                        typedEntries = [];
                        dbContext.entityEntries.update.set(this.metaData, typedEntries);
                    }
                    typedEntries.push(this);
                    break;
                }
            }
            this._state = value;
        }
    }
    constructor(public readonly dbSet: DbSet<T>, public entity: T, public key: string) {
        this._state = EntityState.Detached;

        let propertyChangeHandler: IEventHandler<T, IChangeEventParam<T>> = entity[propertyChangeHandlerMetaKey];
        if (!propertyChangeHandler) {
            let propertyChangeDispatcher: any;
            [propertyChangeHandler, propertyChangeDispatcher] = EventHandlerFactory<T, IChangeEventParam<T>>(entity);
            entity[propertyChangeHandlerMetaKey] = propertyChangeHandler;
            entity[propertyChangeDispatherMetaKey] = propertyChangeDispatcher;
        }
        propertyChangeHandler.add((source: T, args: IChangeEventParam) => this.onPropertyChanged(args));

        let relationChangeHandler: IEventHandler<T, IRelationChangeEventParam> = entity[relationChangeHandlerMetaKey];
        if (!relationChangeHandler) {
            let relationChangeDispatcher: any;
            [relationChangeHandler, relationChangeDispatcher] = EventHandlerFactory<T, IRelationChangeEventParam>(entity);
            entity[relationChangeHandlerMetaKey] = relationChangeHandler;
            entity[relationChangeDispatherMetaKey] = relationChangeDispatcher;
        }
        relationChangeHandler.add((source: T, args: IRelationChangeEventParam) => this.onRelationChanged(args));
    }

    public enableTrackChanges = true;
    public relationMap: { [relationName in keyof T]?: Map<EntityEntry, RelationEntry<T, any> | RelationEntry<any, T>> } = {};
    private _originalValues: Map<keyof T, any> = new Map();
    private _state: EntityState;
    public acceptChanges(...properties: Array<KeysType<T, ValueType>>) {
        if (properties.any() && this.state !== EntityState.Modified) {
            return;
        }

        switch (this.state) {
            case EntityState.Modified: {
                let acceptedProperties: Array<keyof T> = [];
                if (properties.any()) {
                    for (const prop of properties) {
                        const isDeleted = this._originalValues.delete(prop);
                        if (isDeleted) {
                            acceptedProperties.push(prop);
                        }
                    }
                }
                else {
                    acceptedProperties = Array.from(this._originalValues.keys());
                    this._originalValues.clear();
                }

                for (const prop of acceptedProperties.intersect(this.metaData.primaryKeys.select((o) => o.propertyName))) {
                    // reflect update option
                    const relations = this.metaData.relations
                        .where((rel) => rel.isMaster && rel.relationColumns.any((o) => o.propertyName === prop)
                            && (rel.updateOption === "CASCADE" || rel.updateOption === "SET NULL" || rel.updateOption === "SET DEFAULT"));
                    for (const rel of relations) {
                        const relationData = this.relationMap[rel.propertyName];
                        if (!relationData) {
                            continue;
                        }
                        const col = rel.relationColumns.first((o) => o.propertyName === prop);
                        const rCol = rel.relationMaps.get(col);
                        for (const relEntry of relationData.values()) {
                            switch (rel.updateOption) {
                                case "CASCADE": {
                                    relEntry.slaveEntry[rCol.propertyName] = this.entity[prop as keyof T];
                                    break;
                                }
                                case "SET NULL": {
                                    relEntry.slaveEntry[rCol.propertyName] = null;
                                    break;
                                }
                                case "SET DEFAULT": {
                                    relEntry.slaveEntry[rCol.propertyName] = rCol ? ExpressionExecutor.execute(rCol.defaultExp) : null;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (this._originalValues.size <= 0) {
                    this.state = EntityState.Unchanged;
                }
                break;
            }
            case EntityState.Deleted: {
                this.state = EntityState.Detached;

                for (const relMeta of this.dbSet.metaData.relations) {
                    let relEntities: any[] = [];
                    const relProp = this.entity[relMeta.propertyName];
                    if (Array.isArray(relProp)) {
                        relEntities = relEntities.concat(this.entity[relMeta.propertyName]);
                    }
                    else if (relProp) {
                        relEntities = [relProp];
                    }
                    if (relMeta.reverseRelation.relationType === "one") {
                        relEntities.forEach((o) => o[relMeta.reverseRelation.propertyName] = null);
                    }
                    else {
                        relEntities.forEach((o) => o[relMeta.reverseRelation.propertyName].delete(this.entity));
                    }

                    // apply delete option
                    const relations = this.metaData.relations
                        .where((o) => o.isMaster
                            && (o.updateOption === "CASCADE" || o.updateOption === "SET NULL" || o.updateOption === "SET DEFAULT"));

                    for (const o of relations) {
                        const relEntryMap = this.relationMap[o.propertyName];
                        if (!relEntryMap) {
                            continue;
                        }
                        for (const relEntry of relEntryMap.values()) {
                            switch (o.updateOption) {
                                case "CASCADE": {
                                    relEntry.slaveEntry.state = EntityState.Deleted;
                                    (relEntry.slaveEntry as EntityEntry).acceptChanges();
                                    break;
                                }
                                case "SET NULL": {
                                    for (const rCol of (relEntry.slaveRelation as IRelationMetaData<any, T>).mappedRelationColumns) {
                                        relEntry.slaveEntry[rCol.propertyName] = null;
                                        (relEntry.slaveEntry as EntityEntry).acceptChanges(rCol.propertyName);
                                    }
                                    break;
                                }
                                case "SET DEFAULT": {
                                    for (const rCol of (relEntry.slaveRelation as IRelationMetaData<any, T>).mappedRelationColumns) {
                                        if (rCol.defaultExp) {
                                            relEntry.slaveEntry[rCol.propertyName] = ExpressionExecutor.execute(rCol.defaultExp);
                                            (relEntry.slaveEntry as EntityEntry).acceptChanges(rCol.propertyName);
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
                break;
            }
            case EntityState.Added: {
                this.state = EntityState.Unchanged;
            }
        }
    }

    public add() {
        this.state = this.state === EntityState.Deleted ? EntityState.Unchanged : EntityState.Added;
    }

    public delete() {
        this.state = this.state === EntityState.Added || this.state === EntityState.Detached ? EntityState.Detached : EntityState.Deleted;
    }
    public getModifiedProperties() {
        return Array.from(this._originalValues.keys());
    }
    public getOriginalValue(prop: keyof T) {
        if (this._originalValues.has(prop)) {
            return this._originalValues.get(prop);
        }
        return this.entity[prop];
    }

    public getPrimaryValues() {
        const res: any = {};
        for (const o of this.dbSet.primaryKeys) {
            res[o.propertyName] = this.entity[o.propertyName];
        }
        return res;
    }

    //#region Relations
    public getRelation<T2>(propertyName: keyof T, relatedEntry: EntityEntry<T2>): RelationEntry<T, T2> | RelationEntry<T2, T> {
        const relationMeta: IRelationMetaData<T, T2> = this.metaData.relations.first((o) => o.propertyName === propertyName);
        let relGroup = this.relationMap[propertyName];
        if (!relGroup) {
            relGroup = new Map();
            this.relationMap[propertyName] = relGroup;
        }
        let relEntry: RelationEntry<T, T2> | RelationEntry<T2, T> = relGroup.get(relatedEntry);
        if (!relEntry) {
            if (relationMeta.isMaster) {
                relEntry = relatedEntry.getRelation(relationMeta.reverseRelation.propertyName as any, this);
            }
            else {
                relEntry = new RelationEntry(this, relatedEntry, relationMeta);
            }
            relGroup.set(relatedEntry, relEntry);
        }
        return relEntry;
    }
    public isPropertyModified(prop: keyof T) {
        return this._originalValues.has(prop);
    }
    /**
     * Load relation to this entity.
     */
    public async loadRelation(...relations: Array<(entity: T) => any>) {
        const paramExp = new ParameterExpression("o", this.dbSet.type);
        const projected = this.dbSet.primaryKeys.select((o) => new FunctionExpression(new MemberAccessExpression(paramExp, o.propertyName), [paramExp])).toArray();
        await this.dbSet.project(...(projected as any[])).include(...relations).find(this.getPrimaryValues());
    }

    //#region asd

    /**
     * Reloads the entity from the database overwriting any property values with values from the database.
     * For modified properties, then the original value will be overwrite with vallue from the database.
     * Note: To get clean entity from database, call resetChanges after reload.
     */
    public async reload() {
        await this.dbSet.find(this.getPrimaryValues(), true);
    }
    //#endregion
    public buildRelation(...relations: Array<KeysExceptType<T, ValueType> | IRelationMetaData<T>>) {
        let relationMetas = this.metaData.relations;
        if (relations.any()) {
            if (typeof relations[0] === "object") {
                relationMetas = relations as IRelationMetaData[];
            }
            else {
                relationMetas = relationMetas.where((o) => (relations as Array<keyof T>).contains(o.propertyName)).toArray();
            }
        }

        for (const relMeta of relationMetas) {
            this.entity[relMeta.propertyName] = this.relatedEntity(relMeta);
        }
    }
    public relatedEntity<T2>(relation: IRelationMetaData<T, T2>) {
        if (!relation) {
            return null;
        }

        const set = this.dbSet.dbContext.set(relation.target.type);
        if (!set) {
            return null;
        }

        if (relation.relationType === "many") {
            let enumerable = set.local;
            for (const [col, tCol] of relation.relationMaps) {
                const propVal = this.entity[col.propertyName] as any;
                if (propVal === undefined) {
                    return undefined;
                }
                enumerable = enumerable.where((o) => o[tCol.propertyName] === propVal);
            }
            return enumerable.toArray();
        }
        else {
            const key: FlatObjectLike<T2> = {};
            for (const [col, tCol] of relation.relationMaps) {
                const propVal = this.entity[col.propertyName] as any;
                if (propVal === undefined) {
                    return undefined;
                }
                key[tCol.propertyName] = propVal;
            }
            return set.findLocal(key);
        }
    }
    public resetChanges(...properties: Array<KeysType<T, ValueType>>) {
        if (!properties.any()) {
            properties = Array.from(this._originalValues.keys()) as Array<KeysType<T, ValueType>>;
        }

        for (const prop of properties) {
            if (this._originalValues.has(prop)) {
                this.entity[prop] = this._originalValues.get(prop);
            }
        }
    }
    public setOriginalValue(property: keyof T, value: any) {
        if (!(property in this.entity)) {
            return;
        }
        if (this.entity[property] === value) {
            this._originalValues.delete(property);
        }
        else if (this.isPropertyModified(property)) {
            this._originalValues.set(property, value);
        }
        else {
            this.enableTrackChanges = false;
            this.entity[property] = value;
            this.enableTrackChanges = true;
        }
    }
    public setOriginalValues(originalValues: { [key: string]: any }) {
        for (const prop in originalValues) {
            const value = originalValues[prop];
            this.setOriginalValue(prop as any, value);
        }
        this.state = this._originalValues.size > 0 ? EntityState.Modified : EntityState.Unchanged;
    }
    protected onRelationChanged(param: IRelationChangeEventParam<T>) {
        for (let item of param.entities) {
            if (item === undefined && param.relation.relationType === "one") {
                // undefined means relation may exist or not, so check related entity from context
                item = this.relatedEntity(param.relation);
                if (!item) {
                    continue;
                }
            }
            const entry = this.dbSet.dbContext.entry(item);
            const relationEntry = this.getRelation(param.relation.propertyName, entry);

            if (this.enableTrackChanges) {
                switch (param.type) {
                    case "add": {
                        if (relationEntry.state !== RelationState.Unchanged) {
                            relationEntry.add();
                        }
                        break;
                    }
                    case "del":
                        if (relationEntry.state !== RelationState.Detached) {
                            relationEntry.delete();
                        }
                        break;
                }
            }
            else {
                relationEntry.state = RelationState.Unchanged;
            }
        }
    }
    protected onPropertyChanged(param: IChangeEventParam<T>) {
        if (this.dbSet.primaryKeys.contains(param.column)) {
            // primary key changed, update dbset entry dictionary.
            this.dbSet.updateEntryKey(this);
        }

        if (param.oldValue !== param.newValue && param.column instanceof EmbeddedRelationMetaData) {
            const embeddedDbSet = this.dbSet.dbContext.set(param.column.target.type);
            new EmbeddedEntityEntry(embeddedDbSet, param.newValue, this);
        }

        if (this.enableTrackChanges && (this.state === EntityState.Modified || this.state === EntityState.Unchanged) && param.oldValue !== param.newValue) {
            const oriValue = this._originalValues.get(param.column.propertyName);
            if (oriValue === param.newValue) {
                this._originalValues.delete(param.column.propertyName);
                if (this._originalValues.size <= 0) {
                    this.state = EntityState.Unchanged;
                }
            }
            else if (oriValue === undefined && param.oldValue !== undefined && !param.column.isReadOnly) {
                this._originalValues.set(param.column.propertyName, param.oldValue);
                if (this.state === EntityState.Unchanged) {
                    this.state = EntityState.Modified;
                }
            }
        }
    }
}

import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";
