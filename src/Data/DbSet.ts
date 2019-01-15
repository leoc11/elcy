import "../Queryable/Queryable.partial";
import { IObjectType, ValueType, DeleteMode, ColumnGeneration } from "../Common/Type";
import { DbContext } from "./DBContext";
import { Queryable } from "../Queryable/Queryable";
import { hashCode, isValue, clone, isNotNull } from "../Helper/Util";
import { entityMetaKey, relationMetaKey, columnMetaKey } from "../Decorator/DecoratorKey";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { Enumerable } from "../Enumerable/Enumerable";
import { RelationMetaData } from "../MetaData/Relation/RelationMetaData";
import { EntityEntry } from "./EntityEntry";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { EmbeddedRelationMetaData } from "../MetaData/EmbeddedColumnMetaData";
import { IQueryCommandExpression } from "../Queryable/QueryExpression/IQueryCommandExpression";
import { QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { IQueryOption } from "../QueryBuilder/Interface/IQueryOption";
import { Diagnostic } from "../Logger/Diagnostic";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { DeferredQuery } from "../QueryBuilder/DeferredQuery";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { WhereQueryable } from "../Queryable/WhereQueryable";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";

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
        visitor.setDefaultBehaviour(result);
        return result;
    }
    public hashCode() {
        return hashCode(this.type.name!);
    }
    public get local(): Enumerable<T> {
        return (Enumerable.from(this.dictionary.values())).select(o => o.entity);
    }
    protected dictionary: Map<string, EntityEntry<T>> = new Map();
    public async find(id: ValueType | { [key in keyof T]: T[key] & ValueType }, forceReload?: boolean) {
        let entity = forceReload ? null : this.findLocal(id);
        if (!entity) {
            entity = await super.find(id);
        }
        return entity;
    }
    public findLocal(id: ValueType | { [key in keyof T]: T[key] & ValueType }): T {
        const entry = this.entry(id);
        return entry ? entry.entity : undefined;
    }
    public entry(entity: T | ValueType | { [key in keyof T]: T[key] & ValueType }) {
        const key = this.getMapKey(entity);
        return this.dictionary.get(key);
    }
    public attach(entity: T): EntityEntry<T> {
        const key = this.getMapKey(entity);
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
                    if (columnMeta instanceof EmbeddedRelationMetaData) {
                        const childSet = this.dbContext.set(columnMeta.target.type);
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
    public new(primaryValue: ValueType | { [key in keyof T]?: T[key] }) {
        const entity = new this.type();
        if (isValue(primaryValue)) {
            if (this.primaryKeys.length !== 1) {
                throw new Error(`${this.type.name} has multiple primary keys`);
            }

            entity[this.primaryKeys.first().propertyName] = primaryValue as any;
        }
        else {
            if (this.primaryKeys.any(o => !(o.generation & ColumnGeneration.Insert) && !o.default && !primaryValue[o.propertyName])) {
                throw new Error(`Primary keys is required`);
            }

            for (const prop in primaryValue) {
                entity[prop] = primaryValue[prop] as any;
            }
        }
        this.dbContext.add(entity);
        return entity;
    }
    public clear() {
        this.dictionary = new Map();
    }
    protected getMapKey(id: ValueType | { [key in keyof T]: T[key] }): string {
        if (!isNotNull(id))
            throw new Error("Parameter cannot be null");
        if (isValue(id))
            return id.toString();

        let keyString = "";
        let useReference = false;
        for (const o of this.primaryKeys) {
            const val = (id as any)[o.propertyName];
            if (!val) {
                if (o.generation & ColumnGeneration.Insert) {
                    useReference = true;
                }
                else {
                    throw new Error(`primary key "${o.propertyName}" required`);
                }
                break;
            }
            else {
                keyString += val.toString() + "|";
            }
        }

        if (useReference) {
            return id as any;
        }
        return keyString.slice(0, - 1);
    }
    public updateEntryKey(entry: EntityEntry<T>) {
        this.dictionary.delete(entry.key);
        entry.key = this.getMapKey(entry.entity);
        this.dictionary.set(entry.key, entry);
    }

    public async insert(...items: Array<{ [key in keyof T]?: T[key] }>) {
        const query = this.deferredInsert(...items);
        return await query.execute();
    }
    public deferredInsert(...items: Array<{ [key in keyof T]?: T[key] }>) {
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);

        if (!Reflect.getOwnMetadata(entityMetaKey, this.type))
            throw new Error(`Only entity supported`);

        const visitor = this.dbContext.queryVisitor;
        const entityExp = new EntityExpression(this.type, visitor.newAlias());

        const valueExp: Array<{ [key in keyof T]?: IExpression<T[key]> }> = [];
        for (const item of items) {
            const itemExp: { [key in keyof T]?: IExpression<T[key]> } = {};
            for (const prop in item) {
                itemExp[prop] = new ValueExpression(item[prop]);
            }
            valueExp.push(itemExp);
        }
        let insertExp = new InsertExpression(entityExp, valueExp);

        const timer = Diagnostic.timer();
        const params = insertExp.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, insertExp, params, (result) => result.sum(o => o.effectedRows), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    // simple update.
    public deferredUpdate(setter: { [key in keyof T]?: T[key] | ((item: T) => ValueType) }) {
        let pkFilter: IExpression<boolean> = null;
        const setterObj = Object.assign({}, setter);
        const paramExp = new ParameterExpression("o", this.type);
        for (const primaryCol of this.metaData.primaryKeys) {
            const val = setter[primaryCol.propertyName];
            if (!val || !isValue(val)) {
                pkFilter = null;
                break;
            }
            const valExp = new ValueExpression(val);
            const logicalExp = new StrictEqualExpression(new MemberAccessExpression(paramExp, primaryCol.propertyName), valExp);
            pkFilter = pkFilter ? new AndExpression(pkFilter, logicalExp) : logicalExp;
            setterObj[primaryCol.propertyName] = undefined;
        }

        let query: Queryable<T> = this;
        if (pkFilter) {
            query = new WhereQueryable(this, new FunctionExpression(pkFilter, [paramExp]));
            return query.deferredUpdate(setterObj);
        }

        return super.deferredUpdate(setter);
    }
    // simple delete.
    public deferredDelete(mode: DeleteMode): DeferredQuery<number>;
    public deferredDelete(key: { [key in keyof T]?: T[key] }, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(predicate?: (item: T) => boolean, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(modeOrKeyOrPredicate?: { [key in keyof T]?: T[key] } | ((item: T) => boolean) | DeleteMode, mode?: DeleteMode): DeferredQuery<number> {
        if (modeOrKeyOrPredicate instanceof Function || typeof modeOrKeyOrPredicate === "string") {
            return super.deferredDelete(modeOrKeyOrPredicate as any, mode);
        }
        else {
            const key = modeOrKeyOrPredicate;
            let pkFilter: IExpression<boolean> = null;
            const paramExp = new ParameterExpression("o", this.type);
            for (const primaryCol of this.metaData.primaryKeys) {
                const val = key[primaryCol.propertyName];
                if (!val || !isValue(val)) {
                    pkFilter = null;
                    break;
                }
                const valExp = new ValueExpression(val);
                const logicalExp = new StrictEqualExpression(new MemberAccessExpression(paramExp, primaryCol.propertyName), valExp);
                pkFilter = pkFilter ? new AndExpression(pkFilter, logicalExp) : logicalExp;
            }

            if (!pkFilter) {
                throw new Error("Missing Primary key to delete");
            }

            return (new WhereQueryable(this, new FunctionExpression(pkFilter, [paramExp]))).deferredDelete(null, mode);
        }
    }

    public async upsert(item: { [key in keyof T]: T[key] }) {
        const query = this.deferredUpsert(item);
        return await query.execute();
    }
    public deferredUpsert(item: { [key in keyof T]: T[key] }) {
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);

        if (!Reflect.getOwnMetadata(entityMetaKey, this.type))
            throw new Error(`Only entity supported`);

        const visitor = this.dbContext.queryVisitor;
        const entityExp = new EntityExpression(this.type, visitor.newAlias());

        const setterExp: { [key in keyof T]?: IExpression<T[key]> } = {};
        for (const prop in item) {
            setterExp[prop] = new ValueExpression(item[prop]);
        }
        let upsertExp = new UpsertExpression(entityExp, setterExp);

        const timer = Diagnostic.timer();
        const params = upsertExp.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, upsertExp, params, (result) => result.sum(o => o.effectedRows), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
}
