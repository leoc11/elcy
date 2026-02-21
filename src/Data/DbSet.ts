import { ColumnGeneration } from "../Common/Enum";
import { DeleteMode } from "../Common/StringType";
import { FlatObjectLike, IObjectType, ObjectLike, SetterObj, StringKeyOf, ValueType } from "../Common/Type";
import { Enumerable } from "@elcy/enumerable";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { hashCode, isNotNull, isNull, isValue } from "../Helper/Util";
import { Diagnostic } from "../Logger/Diagnostic";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { DeferredQuery } from "../Query/DeferredQuery";
import { IQueryOption } from "../Query/IQueryOption";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "../Queryable/Queryable";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";
import { WhereQueryable } from "../Queryable/WhereQueryable";
import { DbContext } from "./DbContext";
import { EntityEntry } from "./EntityEntry";
import { getEntityMetadata } from "src/MetaData/MetaDataMapper";

export class DbSet<T extends object = object> extends Queryable<T> {
    public get dbContext(): DbContext {
        return this._dbContext;
    }
    public get local(): Enumerable<T> {
        return Enumerable.from(this.dictionary).map((o) => o[1].entity);
    }
    public get metaData() {
        if (!this._metaData) {
            this._metaData = getEntityMetadata(this.type) as EntityMetaData<T>;
        }
        return this._metaData;
    }
    public get primaryKeys(): Array<IColumnMetaData<T>> {
        return this.metaData.primaryKeys;
    }
    public get queryOption(): IQueryOption {
        return {};
    }
    constructor(public readonly type: IObjectType<T>, dbContext: DbContext) {
        super(type);
        this._dbContext = dbContext;
    }
    protected dictionary: Map<string, EntityEntry<T>> = new Map();
    private readonly _dbContext: DbContext;
    private _metaData: EntityMetaData<T>;
    public buildQuery(visitor: IQueryVisitor): IQueryExpression<T> {
        const result = new SelectExpression(new EntityExpression(this.type, visitor.newAlias()));
        visitor.setDefaultBehaviour(result);
        return result;
    }
    public clear() {
        this.dictionary = new Map();
    }
    // simple delete.
    public deferredDelete(mode: DeleteMode): DeferredQuery<number>;
    public deferredDelete(key: ObjectLike<T>, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(predicate?: FunctionExpression<boolean, T> | ((item: T) => boolean), mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(modeOrKeyOrPredicate?: ObjectLike<T> | FunctionExpression<boolean, T> | ((item: T) => boolean) | DeleteMode, mode?: DeleteMode): DeferredQuery<number> {
        if (modeOrKeyOrPredicate instanceof Function || modeOrKeyOrPredicate instanceof FunctionExpression || typeof modeOrKeyOrPredicate === "string") {
            return super.deferredDelete(modeOrKeyOrPredicate as FunctionExpression<boolean, T>, mode);
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
    public deferredInsert(...items: Array<FlatObjectLike<T>>) {
        if (!getEntityMetadata(this.type)) {
            throw new Error(`Only entity supported`);
        }

        const visitor = this.dbContext.queryVisitor;
        const entityExp = new EntityExpression(this.type, visitor.newAlias());

        const valueExp: Array<SetterObj<T>> = [];
        for (const item of items) {
            const itemExp: SetterObj<T> = {};
            for (const prop in item) {
                const propValue = item[prop];
                if (propValue !== undefined && !(propValue instanceof Function)) {
                    itemExp[prop] = new ValueExpression(propValue);
                }
            }
            valueExp.push(itemExp);
        }
        const insertExp = new InsertExpression(entityExp, valueExp);

        const timer = Diagnostic.timer();
        const flatParams = this.flatQueryParameter({ index: 0 });
        const params = this.buildParameter(insertExp, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.time()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, insertExp, params, (result) => Enumerable.from(result).sum((o) => o.effectedRows), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    // simple update.
    public deferredUpdate(setter: { [key in keyof T]?: T[key] | ((item: T) => ValueType) }) {
        let pkFilter: IExpression<boolean> = null;
        const setterObj: { [key in keyof T]?: T[key] | ((item: T) => ValueType) } = {};
        const paramExp = new ParameterExpression("o", this.type);
        for (const prop in setter) {
            const primaryCol = this.metaData.primaryKeys.find((o) => o.propertyName === prop);
            if (primaryCol) {
                const val = setter[primaryCol.propertyName];
                if (!val) {
                    continue;
                }
                if (!isValue(val)) {
                    setterObj[prop] = setter[prop];
                    continue;
                }

                const valExp = new ValueExpression(val as T[keyof T]);
                const logicalExp = new StrictEqualExpression(new MemberAccessExpression(paramExp, primaryCol.propertyName), valExp);
                pkFilter = pkFilter ? new AndExpression(pkFilter, logicalExp) : logicalExp;
            }
            else {
                setterObj[prop] = setter[prop];
            }
        }

        if (pkFilter) {
            const query = new WhereQueryable(this, new FunctionExpression(pkFilter, [paramExp]));
            return query.deferredUpdate(setterObj);
        }

        return super.deferredUpdate(setter);
    }
    public deferredUpsert(item: FlatObjectLike<T>) {
        if (!getEntityMetadata(this.type)) {
            throw new Error(`Only entity supported`);
        }

        const visitor = this.dbContext.queryVisitor;
        const entityExp = new EntityExpression(this.type, visitor.newAlias());

        const setterExp: SetterObj<T> = {};
        for (const prop in item) {
            setterExp[prop] = new ValueExpression(item[prop]);
        }
        const upsertExp = new UpsertExpression(entityExp, setterExp);

        const timer = Diagnostic.timer();
        const flatParams = this.flatQueryParameter({ index: 0 });
        const params = this.buildParameter(upsertExp, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.time()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, upsertExp, params, (result) => Enumerable.from(result).sum((o) => o.effectedRows), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public entry(entity: T | FlatObjectLike<T>) {
        const key = this.getKey(entity);
        let entry = this.dictionary.get(key);
        if (entry) {
            if (entry.entity !== entity) {
                entry.setOriginalValues(entity);
            }
        }
        else {
            if (!(entity instanceof this.type)) {
                const entityType = new this.type();
                entry = new EntityEntry<T>(this, entityType, key);
                entry.setOriginalValues(entity);
            }
            else {
                entry = new EntityEntry<T>(this, entity, key);
            }
            this.dictionary.set(key, entry);
        }
        return entry;
    }
    public async find(predicate?: (item: T) => boolean): Promise<T>;
    public async find(id: ValueType | FlatObjectLike<T>, forceReload?: boolean): Promise<T>;
    public async find(idOrPredicate?: ValueType | FlatObjectLike<T> | ((item: T) => boolean), forceReload?: boolean) {
        let entity: T;
        if (!idOrPredicate) {
            entity = await super.find();
        }
        else if (idOrPredicate instanceof Function) {
            entity = await super.find(idOrPredicate);
        }
        else {
            entity = forceReload ? null : this.findLocal(idOrPredicate);
            if (!entity) {
                entity = await super.find(idOrPredicate);
            }
        }
        
        return entity;
    }
    public findLocal(id: ValueType | FlatObjectLike<T>): T {
        const key = this.getKey(id);
        const entry = this.dictionary.get(key);
        return entry ? entry.entity : undefined;
    }
    public getKey(id: ValueType | FlatObjectLike<T>): string {
        if (isNull(id)) {
            throw new Error("Parameter cannot be null");
        }
        if (isValue(id)) {
            return (id as string).toString();
        }

        let keyString = "";
        let useReference = false;
        for (const o of this.primaryKeys) {
            const val = id[o.propertyName];
            if (isNull(val)) {
                if (o.generation & ColumnGeneration.Insert) {
                    useReference = true;
                }
                else {
                    throw new Error(`primary key "${o.propertyName}" required`);
                }
                break;
            }
            else {
                keyString += (val as string) + "|";
            }
        }

        if (useReference) {
            // TODO: need to find other way for db value data
            return id as unknown as string;
        }
        return keyString.slice(0, - 1);
    }
    public hashCode() {
        return hashCode(this.type.name);
    }

    public async insert(...items: Array<FlatObjectLike<T>>) {
        const query = this.deferredInsert(...items);
        return await query.execute();
    }
    public new(primaryValue: ValueType | ObjectLike<T>) {
        const entity = new this.type();
        if (isValue(primaryValue)) {
            if (this.primaryKeys.length !== 1) {
                throw new Error(`${this.type.name} has multiple primary keys`);
            }

            entity[this.primaryKeys.find(() => true).propertyName] = primaryValue as T[StringKeyOf<T>];
        }
        else {
            if (this.primaryKeys.some((o) => !(o.generation & ColumnGeneration.Insert) && !o.defaultExp && !primaryValue[o.propertyName])) {
                throw new Error(`Primary keys is required`);
            }

            for (const prop in primaryValue) {
                entity[prop] = primaryValue[prop] as T[StringKeyOf<T>];
            }
        }
        this.dbContext.add(entity);
        return entity;
    }
    public updateEntryKey(entry: EntityEntry<T>) {
        this.dictionary.delete(entry.key);
        entry.key = this.getKey(entry.entity);
        this.dictionary.set(entry.key, entry);
    }

    public async upsert(item: FlatObjectLike<T>) {
        const query = this.deferredUpsert(item);
        return await query.execute();
    }
}
