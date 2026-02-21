import { Enumerable } from "@elcy/enumerable";
import { FlatObjectLike, KeysExceptType, KeysType, StringKeyOf, ValueType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { EmbeddedRelationMetaData } from "../MetaData/EmbeddedColumnMetaData";
import { IChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { DbSet } from "./DbSet";
import { trackEntity } from "./EntityChangeTracker";
import { EntityState } from "./EntityState";
import { IEntityEntry } from "./Interface/IEntityEntry";
import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { QueryableChain } from "src/Queryable/Interface/QueryableChain";

export class EntityEntry<T extends object = object> implements IEntityEntry<T> {
    public get isCompletelyLoaded() {
        return this.dbSet.metaData.columns.every((o) => this.entity[o.propertyName] !== undefined);
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
                        ArrayExtension.delete(typedAddEntries, this);
                    }
                    break;
                }
                case EntityState.Deleted: {
                    const typedEntries = dbContext.entityEntries.delete.get(this.metaData);
                    if (typedEntries) {
                        ArrayExtension.delete(typedEntries, this);
                    }
                    break;
                }
                case EntityState.Modified: {
                    const typedEntries = dbContext.entityEntries.update.get(this.metaData);
                    if (typedEntries) {
                        ArrayExtension.delete(typedEntries, this);
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
        trackEntity(entity, (_: T, args: IChangeEventParam<T>) => this.onPropertyChanged(args));
    }

    //#endregion

    public enableTrackChanges = true;
    private _originalValues: Map<StringKeyOf<T>, unknown> = new Map();
    private _state: EntityState;
    public acceptChanges(...properties: Array<KeysType<T, ValueType>>) {
        if (properties.length && this.state !== EntityState.Modified) {
            return;
        }

        switch (this.state) {
            case EntityState.Modified: {
                let acceptedProperties: Array<StringKeyOf<T>> = [];
                if (properties.length) {
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

                for (const prop of Enumerable.from(acceptedProperties).intersect(Enumerable.from(this.metaData.primaryKeys).map((o) => o.propertyName))) {
                    // reflect update option
                    const relations = this.metaData.relations
                        .filter((rel) => rel.isMaster && rel.relationColumns.some((o) => o.propertyName === prop)
                            && (rel.updateOption === "CASCADE" || rel.updateOption === "SET NULL" || rel.updateOption === "SET DEFAULT"));
                    for (const rel of relations) {
                        let childEntities: unknown[] = [];
                        if (rel.relationType === "one") {
                            const childEntity = this.entity[rel.propertyName];
                            if (childEntity) {
                                childEntities = [childEntity];
                            }
                        }
                        else {
                            childEntities = this.entity[rel.propertyName] as [];
                        }

                        if (!childEntities.length) {
                            continue;
                        }

                        const col = rel.relationColumns.find((o) => o.propertyName === prop);
                        const rCol = rel.relationMaps.get(col);
                        for (const childEntity of childEntities) {
                            switch (rel.updateOption) {
                                case "CASCADE": {
                                    childEntity[rCol.propertyName as string] = this.entity[prop];
                                    break;
                                }
                                case "SET NULL": {
                                    childEntity[rCol.propertyName as string] = null;
                                    break;
                                }
                                case "SET DEFAULT": {
                                    childEntity[rCol.propertyName as string] = rCol?.defaultExp ? ExpressionExecutor.execute(rCol.defaultExp) : null;
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

                for (const relMeta of this.metaData.relations) {
                    let childEntities: object[] = [];
                    const relProp = this.entity[relMeta.propertyName];
                    if (Array.isArray(relProp)) {
                        childEntities = relProp.slice();
                    }
                    else if (relProp) {
                        childEntities = [relProp as object];
                    }

                    if (!childEntities.length) {
                        continue;
                    }

                    if (relMeta.reverseRelation.relationType === "one") {
                        childEntities.forEach((o) => o[relMeta.reverseRelation.propertyName as any] = null);
                    }
                    else {
                        childEntities.forEach((o) => ArrayExtension.delete(o[relMeta.reverseRelation.propertyName] as T[], this.entity));
                    }

                    if (!(relMeta.isMaster && (relMeta.updateOption === "CASCADE" || relMeta.updateOption === "SET NULL" || relMeta.updateOption === "SET DEFAULT"))) {
                        continue;
                    }

                    const relCols = Enumerable.from(relMeta.relationMaps)
                        .filter(o => this.metaData.primaryKeys.includes(o[0]))
                        .map(o => o[1]);
                    if (!relCols.some()) {
                        continue;
                    }

                    // apply delete option
                    for (const childEntity of childEntities) {
                        const childEntry = this.dbSet.dbContext.entry(childEntity as object);
                        if (childEntry.state === EntityState.Detached) {
                            continue;
                        }

                        switch (relMeta.updateOption) {
                            case "CASCADE": {
                                childEntry.state = EntityState.Deleted;
                                childEntry.acceptChanges();
                                break;
                            }
                            case "SET NULL": {
                                for (const col of relCols) {
                                    childEntity[col.propertyName as string] = null;
                                }
                                childEntry.acceptChanges(...relCols.map(o => o.propertyName));
                                break;
                            }
                            case "SET DEFAULT": {
                                for (const col of relCols) {
                                    childEntity[col.propertyName as string] = col?.defaultExp ? ExpressionExecutor.execute(col.defaultExp) : null;
                                }
                                childEntry.acceptChanges(...relCols.map(o => o.propertyName));
                                break;
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

    //#region change state

    public add() {
        this.state = this.state === EntityState.Deleted ? EntityState.Unchanged : EntityState.Added;
    }

    public delete() {
        this.state = this.state === EntityState.Added || this.state === EntityState.Detached ? EntityState.Detached : EntityState.Deleted;
    }
    public getModifiedProperties() {
        return Array.from(this._originalValues.keys());
    }
    public getOriginalValue(prop: StringKeyOf<T>) {
        if (this._originalValues.has(prop)) {
            return this._originalValues.get(prop);
        }
        return this.entity[prop];
    }

    public getPrimaryValues() {
        const res: FlatObjectLike<T> = {};
        for (const o of this.dbSet.primaryKeys) {
            res[o.propertyName] = this.entity[o.propertyName] as T[StringKeyOf<T>] & ValueType;
        }
        return res;
    }

    //#region Relations
    public isPropertyModified(prop: StringKeyOf<T>) {
        return this._originalValues.has(prop);
    }
    /**
     * Load relation to this entity.
     */
    public async loadRelation(...relations: Array<(entity: QueryableChain<T>) => unknown>) {
        const paramExp = new ParameterExpression("o", this.dbSet.type);
        const projected = this.dbSet.primaryKeys.map((o) => new FunctionExpression<T[StringKeyOf<T>] & ValueType, T>(new MemberAccessExpression(paramExp, o.propertyName), [paramExp]));
        await this.dbSet.project(...projected).loads(...relations).find(this.getPrimaryValues());
    }

    /**
     * Reloads the entity from the database overwriting any property values with values from the database.
     * For modified properties, then the original value will be overwrite with vallue from the database.
     * Note: To get clean entity from database, call resetChanges after reload.
     */
    public async reload() {
        await this.dbSet.find(this.getPrimaryValues(), true);
    }

    public buildRelation(...relations: Array<KeysExceptType<T, ValueType> | IRelationMetaData<T>>) {
        let relationMetas = this.metaData.relations;
        if (relations.some(() => true)) {
            if (typeof relations[0] === "object") {
                relationMetas = relations as IRelationMetaData[];
            }
            else {
                relationMetas = relationMetas.filter((o) => (relations as Array<keyof T>).includes(o.propertyName));
            }
        }

        for (const relMeta of relationMetas) {
            this.entity[relMeta.propertyName] = this.relatedEntity(relMeta as IRelationMetaData<T, object & T[StringKeyOf<T>], "one">);
        }
    }
    public relatedEntity<T2 extends object = object>(relation: IRelationMetaData<T, T2, "one">): T2
    public relatedEntity<T2 extends object = object>(relation: IRelationMetaData<T, T2, "many">): T2[]
    public relatedEntity<T2 extends object = object>(relation: IRelationMetaData<T, T2>): T2 | T2[] {
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
                const propVal = this.entity[col.propertyName] as unknown as T2[StringKeyOf<T2>];
                if (propVal === undefined) {
                    return undefined;
                }
                enumerable = enumerable.filter((o) => o[tCol.propertyName] === propVal);
            }
            return enumerable.toArray();
        }
        else {
            const key: FlatObjectLike<T2> = {};
            for (const [col, tCol] of relation.relationMaps) {
                const propVal = this.entity[col.propertyName] as unknown as T2[StringKeyOf<T2>] & ValueType;
                if (propVal === undefined) {
                    return undefined;
                }
                key[tCol.propertyName] = propVal;
            }
            return set.findLocal(key);
        }
    }
    public resetChanges(...properties: Array<KeysType<T, ValueType>>) {
        if (properties.length <= 0) {
            properties = Array.from(this._originalValues.keys()) as Array<KeysType<T, ValueType>>;
        }

        for (const prop of properties) {
            if (this._originalValues.has(prop)) {
                this.entity[prop] = this._originalValues.get(prop) as T[KeysType<T, ValueType>];
            }
        }
    }
    public setOriginalValue(property: StringKeyOf<T>, value: T[StringKeyOf<T>]) {
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
    public setOriginalValues(originalValues: FlatObjectLike<T>) {
        for (const prop in originalValues) {
            const value = originalValues[prop];
            this.setOriginalValue(prop, value);
        }
        this.state = this._originalValues.size > 0 ? EntityState.Modified : EntityState.Unchanged;
    }
    protected onPropertyChanged(param: IChangeEventParam<T>) {
        if (this.dbSet.primaryKeys.includes(param.column)) {
            // primary key changed, update dbset entry dictionary.
            this.dbSet.updateEntryKey(this);
        }

        if (param.oldValue !== param.newValue && param.column instanceof EmbeddedRelationMetaData) {
            const embeddedDbSet = this.dbSet.dbContext.set(param.column.target.type);
            void import("./EmbeddedEntityEntry").then(o => new o.EmbeddedEntityEntry(embeddedDbSet, param.newValue as object, this));
        }

        if (!this.enableTrackChanges) {
            return;
        }

        // if deletedColumn changed to true, then entry state should be changed accordingly
        if (this.metaData.deletedColumn === param.column && this.state !== EntityState.Detached) {
            if (param.newValue && this.state != EntityState.Deleted) {
                this.state = EntityState.Deleted;
            }
            else if (!param.newValue && this.state == EntityState.Deleted) {
                this.state = EntityState.Unchanged;
            }
        }
        if (param.oldValue !== param.newValue && (this.state === EntityState.Modified || this.state === EntityState.Unchanged)) {
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
    //#endregion
}