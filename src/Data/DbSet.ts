import "../Queryable/Queryable.partial";
import { IObjectType, ValueType } from "../Common/Type";
import { DbContext } from "./DBContext";
import { Queryable } from "../Queryable/Queryable";
import { hashCode, isValue } from "../Helper/Util";
import { entityMetaKey, relationMetaKey, columnMetaKey } from "../Decorator/DecoratorKey";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { Enumerable } from "../Enumerable/Enumerable";
import { RelationMetaData } from "../MetaData/Relation/RelationMetaData";
import { EntityEntry } from "./EntityEntry";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { RelationEntry } from "./RelationEntry";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { EmbeddedColumnMetaData } from "../MetaData/EmbeddedColumnMetaData";
import { IQueryCommandExpression } from "../Queryable/QueryExpression/IQueryCommandExpression";
import { QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { IQueryOption } from "../QueryBuilder/Interface/IQueryOption";

export class DbSet<T> extends Queryable<T> {
    public get dbContext(): DbContext {
        return this._dbContext;
    }
    public get queryOption(): IQueryOption {
        return {};
    }
    public get metaData() {
        if (!this._metaData)
            this._metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        return this._metaData;
    }
    public get primaryKeys(): IColumnMetaData<T>[] {
        return this.metaData.primaryKeys;
    }
    private readonly _dbContext: DbContext;
    private _metaData: EntityMetaData<T>;
    constructor(public readonly type: IObjectType<T>, dbContext: DbContext) {
        super(type);
        this._dbContext = dbContext;
    }
    public buildQuery(visitor: QueryVisitor): IQueryCommandExpression<T> {
        const result = new SelectExpression(new EntityExpression(this.type, visitor.newAlias()));
        visitor.setDefaultOrder(result);

        const option = visitor.options;
        if (result.entity.deleteColumn && !(option && option.includeSoftDeleted)) {
            result.addWhere(new StrictEqualExpression(result.entity.deleteColumn, new ValueExpression(false)));
        }

        return result;
    }
    public hashCode() {
        return hashCode(this.type.name!);
    }
    public get local(): Enumerable<T> {
        return (new Enumerable(this.dictionary.values())).select(o => o.entity);
    }
    protected dictionary: Map<string, EntityEntry<T>> = new Map();
    protected relationDictionary: Map<string, RelationEntry<T>> = new Map();
    public async find(id: ValueType | { [key in keyof T]: ValueType }, forceReload?: boolean) {
        let entity = forceReload ? null : this.findLocal(id);
        if (!entity) {
            entity = await super.find(id);
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
            Object.keys(entity).union(Object.keys(entry.dbSet.type.prototype)).each((prop: keyof T) => {
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
        return this.primaryKeys.select(o => {
            const val = (id as any)[o.propertyName];
            return val ? val.toString() : "";
        }).toArray().join("|");
    }
    public updateEntryKey(entry: EntityEntry<T>) {
        this.dictionary.delete(entry.key);
        entry.key = this.getMapKey(entry.entity);
        this.dictionary.set(entry.key, entry);
    }
}
