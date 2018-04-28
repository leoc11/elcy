import { IObjectType, ValueType } from "../Common/Type";
import { DbContext } from "./DBContext";
import { NamingStrategy } from "../QueryBuilder/NamingStrategy";
import { Queryable } from "../Queryable";
import "../Queryable/Queryable.partial";
import { ICommandQueryExpression } from "../Queryable/QueryExpression/ICommandQueryExpression";
import { EntityExpression, SelectExpression } from "../Queryable/QueryExpression/index";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { hashCode, isValue } from "../Helper/Util";
import { entityMetaKey, relationMetaKey } from "../Decorator/DecoratorKey";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { Enumerable } from "../Enumerable/Enumerable";
import { EntityEntry } from "./Interface/IEntityEntry";
import { RelationMetaData } from "../MetaData/Relation/RelationMetaData";

export class DbSet<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.addParameters(this.parameters);
        return queryBuilder;
    }
    public get dbContext(): DbContext {
        return this._dbContext;
    }
    public get metaData() {
        if (!this._metaData)
            this._metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        return this._metaData;
    }
    protected get primaryKeys() {
        return this.metaData.primaryKeys;
    }
    public readonly namingStrategy: NamingStrategy;
    private readonly _dbContext: DbContext;
    private _metaData: EntityMetaData<T>;
    constructor(public readonly type: IObjectType<T>, dbContext: DbContext) {
        super(type);
        this._dbContext = dbContext;
    }
    public buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<T> {
        return new SelectExpression<T>(new EntityExpression(this.type, queryBuilder.newAlias()));
    }
    public toString() {
        const q = this.queryBuilder;
        return this.buildQuery(q).toString(q);
    }
    public hashCode() {
        return hashCode(this.type.name!);
    }
    public get local(): Enumerable<T> {
        return new Enumerable(this.localCache);
    }
    protected localCache: T[] = [];
    protected dictionary: Map<string, EntityEntry<T>> = new Map();
    public find(id: ValueType | { [key in keyof T]: ValueType }): T | undefined {
        return this.findLocal(id);
    }
    public findLocal(id: ValueType | { [key in keyof T]: ValueType }): T | undefined {
        const entry = this.entry(id);
        return entry ? entry.entity : undefined;
    }
    public entry(entity: T | ValueType | { [key in keyof T]: ValueType }) {
        const key = this.getMapKey(entity);
        return this.dictionary.get(key);
    }
    public attach(entity: T): EntityEntry<T> {
        const key = this.getMapKey(entity as any);
        let entry = this.entry(key) as EntityEntry<T>;
        if (entry) {
            Object.keys(entity).map((prop: keyof T) => {
                let value = entity[prop];
                if (value === undefined)
                    return;
                const relationMeta: RelationMetaData<T, any> = Reflect.getOwnMetadata(relationMetaKey, this.type, prop);
                const childSet = relationMeta ? this.dbContext.set(relationMeta.targetType) : undefined;
                if (childSet) {
                    if (relationMeta.relationType === "one") {
                        const childEntry = childSet.attach(value);
                        entity[prop] = value = childEntry.entity;
                    }
                    else if (Array.isArray(value)) {
                        entity[prop] = value = value.select((val: any) => {
                            const childEntry = childSet.attach(val);
                            return childEntry.entity;
                        }).toArray() as any;
                    }
                }

                else if (!entry.isPropertyModified(prop) || entry.getOriginalValue(prop) !== value)
                    entry.entity[prop] = value;
            });
        }
        else {
            entry = new EntityEntry(this, entity);
            this.dictionary.set(key, entry!);
            this.localCache.push(entity);
        }
        return entry;
    }
    protected getMapKey(id: ValueType | { [key in keyof T]: any }): string {
        if (isValue(id))
            return id.toString();
        return this.primaryKeys.select(o => (id as any)[o]).toArray().join("|");
    }
}
