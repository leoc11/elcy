import { IObjectType, ValueType } from "../Common/Type";
import { DbContext } from "./DBContext";
import { NamingStrategy } from "../QueryBuilder/NamingStrategy";
import { Queryable, WhereQueryable } from "../Queryable";
import "../Queryable/Queryable.partial";
import { ICommandQueryExpression } from "../Queryable/QueryExpression/ICommandQueryExpression";
import { EntityExpression, SelectExpression } from "../Queryable/QueryExpression/index";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { hashCode, isValue } from "../Helper/Util";
import { entityMetaKey, relationMetaKey, columnMetaKey } from "../Decorator/DecoratorKey";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { Enumerable } from "../Enumerable/Enumerable";
import { RelationMetaData } from "../MetaData/Relation/RelationMetaData";
import { FunctionExpression, ParameterExpression, IExpression, EqualExpression, MemberAccessExpression, AndExpression } from "../ExpressionBuilder/Expression";
import { EntityEntry } from "./EntityEntry";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { EmbeddedColumnMetaData } from "../MetaData";

export class DbSet<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        const queryBuilder = new this.dbContext.queryBuilder();
        if (this.options.userParameters)
            queryBuilder.addParameters(this.options.userParameters);
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
    public get primaryKeys(): IColumnMetaData<T>[] {
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
        return (new Enumerable(this.dictionary.values())).select(o => o.entity);
    }
    protected dictionary: Map<string, EntityEntry<T>> = new Map();
    public async find(id: ValueType | { [key in keyof T]: ValueType }): Promise<T> {
        let entity = this.findLocal(id);
        if (!entity) {
            const isValueType = isValue(id);
            const param = new ParameterExpression("o", this.type);
            const paramId = new ParameterExpression("id", id.constructor as any);
            let andExp: IExpression<boolean>;
            if (isValueType) {
                andExp = new EqualExpression(new MemberAccessExpression(param, this.primaryKeys.first().propertyName), paramId);
            }
            else {
                for (const pk of this.primaryKeys) {
                    const d = new EqualExpression(new MemberAccessExpression(param, pk.propertyName), new MemberAccessExpression(paramId, pk.propertyName));
                    andExp = andExp ? new AndExpression(andExp, d) : d;
                }
            }
            const a = new FunctionExpression(andExp, [param]);
            const v = new WhereQueryable(this, a);
            entity = await v.setParameters({ id }).first();
        }
        return entity;
    }
    public findLocal(id: ValueType | { [key in keyof T]: ValueType }): T {
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
                const childSet = relationMeta ? this.dbContext.set(relationMeta.target.type) : undefined;
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
                else {
                    const columnMeta: IColumnMetaData<T, any> = Reflect.getOwnMetadata(columnMetaKey, this.type, prop);
                    if (columnMeta instanceof EmbeddedColumnMetaData) {
                        const childSet = this.dbContext.set(columnMeta.type);
                        if (childSet) {
                            // TODO
                            const childEntry = childSet.attach(value);
                            entity[prop] = value = childEntry.entity;
                        }
                    }
                    else if (!entry.isPropertyModified(prop) || entry.getOriginalValue(prop) !== value)
                        entry.entity[prop] = value;
                }
            });
        }
        else {
            entry = new EntityEntry(this, entity, key);
            this.dictionary.set(key, entry);
        }
        return entry;
    }
    public new(primaryValue: ValueType | { [key in keyof T]?: ValueType }) {
        const entity = new this.type();
        if (isValue(primaryValue)) {
            if (this.primaryKeys.length !== 1) {
                throw new Error(`${this.type.name} has multiple primary keys`);
            }

            entity[this.primaryKeys.first().propertyName] = primaryValue as any;
        }
        else {
            for (const pk of this.primaryKeys) {
                entity[pk.propertyName] = primaryValue[pk.propertyName] as any;
            }
        }
        this.dbContext.add(entity);
        return entity;
    }
    public clear() {
        this.dictionary = new Map();
    }
    protected getMapKey(id: ValueType | { [key in keyof T]: any }): string {
        if (isValue(id))
            return id.toString();
        return this.primaryKeys.select(o => (id as any)[o.propertyName]).toArray().join("|");
    }
    public updateEntryKey(entry: EntityEntry<T>) {
        this.dictionary.delete(entry.key);
        entry.key = this.getMapKey(entry.entity);
        this.dictionary.set(entry.key, entry);
    }
}
