import { ColumnGeneration, QueryType } from "../Common/Enum";
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
import { hashCode, isNull, isValue } from "../Helper/Util";
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
import { RawQueryable } from "src/Queryable/RawQueryable";
import { QueryableChain } from "src/Queryable/Interface/QueryableChain";

export class DbSet<TE extends object = any> extends Queryable<TE> {
    public override get dbContext(): DbContext {
        return this._dbContext;
    }

    public get metaData() {
        if (!this._metaData) {
            this._metaData = getEntityMetadata(this.type) as EntityMetaData<TE>;
        }
        return this._metaData;
    }
    public get primaryKeys(): Array<IColumnMetaData<TE>> {
        return this.metaData.primaryKeys;
    }
    public override get queryOption(): IQueryOption {
        return {};
    }
    constructor(public override readonly type: IObjectType<TE>, dbContext: DbContext) {
        super(type);
        this._dbContext = dbContext;
    }
    protected readonly dictionary: Map<string, EntityEntry<TE>> = new Map();
    public readonly local: Enumerable<TE> = Enumerable.from(this.dictionary).map((o) => o[1].entity);
    private readonly _dbContext: DbContext;
    private _metaData: EntityMetaData<TE>;
    public buildQuery(visitor: IQueryVisitor): IQueryExpression<TE> {
        const result = new SelectExpression(new EntityExpression(this.type, visitor.newAlias()));
        visitor.setDefaultBehaviour(result);
        return result;
    }
    public clear() {
        this.dictionary.clear();
    }
    // simple delete.
    public override deferredDelete(mode: DeleteMode): DeferredQuery<number>;
    public override deferredDelete(key: ObjectLike<TE>, mode?: DeleteMode): DeferredQuery<number>;
    public override deferredDelete(predicate?: FunctionExpression<boolean, [TE]> | ((item: QueryableChain<TE>) => boolean), mode?: DeleteMode): DeferredQuery<number>;
    public override deferredDelete(modeOrKeyOrPredicate?: ObjectLike<TE> | FunctionExpression<boolean, [TE]> | ((item: QueryableChain<TE>) => boolean) | DeleteMode, mode?: DeleteMode): DeferredQuery<number> {
        if (modeOrKeyOrPredicate instanceof Function || modeOrKeyOrPredicate instanceof FunctionExpression || typeof modeOrKeyOrPredicate === "string") {
            return super.deferredDelete(modeOrKeyOrPredicate as FunctionExpression<boolean, [TE]>, mode);
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
    public deferredInsert(...items: Array<FlatObjectLike<TE>>) {
        if (!getEntityMetadata(this.type)) {
            throw new Error(`Only entity supported`);
        }

        const visitor = this.dbContext.queryVisitor;
        const entityExp = new EntityExpression(this.type, visitor.newAlias());

        const valueExp: Array<SetterObj<TE>> = [];
        for (const item of items) {
            const itemExp: SetterObj<TE> = {};
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

        const query = new DeferredQuery(this.dbContext, insertExp, params, (resultMap) => {
            let effectedRows = 0;
            for (const [command, result] of resultMap) {
                if (command.type & QueryType.ADDITIONAL) {
                    continue;
                }
                if (command.type & QueryType.DML) {
                    effectedRows += result.effectedRows;
                }
            }
            return effectedRows;
        }, this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    // simple update.
    public override deferredUpdate(setter: { [TK in keyof TE]?: (TE[TK] & ValueType) | ((item: QueryableChain<TE>) => TE[TK] & ValueType) }) {
        let pkFilter: IExpression<boolean> = null;
        const setterObj: { [TK in keyof TE]?: (TE[TK] & ValueType) | ((item: QueryableChain<TE>) => TE[TK] & ValueType) } = {};
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

                const valExp = new ValueExpression(val as TE[keyof TE]);
                const logicalExp = new StrictEqualExpression(new MemberAccessExpression(paramExp, primaryCol.propertyName), valExp);
                pkFilter = pkFilter ? new AndExpression(pkFilter, logicalExp) : logicalExp;
            }
            else {
                setterObj[prop] = setter[prop];
            }
        }

        if (pkFilter) {
            const query = this.filter(new FunctionExpression(pkFilter, [paramExp]));
            return query.deferredUpdate(setterObj);
        }

        return super.deferredUpdate(setter);
    }
    public deferredUpsert(item: FlatObjectLike<TE>) {
        if (!getEntityMetadata(this.type)) {
            throw new Error(`Only entity supported`);
        }

        const visitor = this.dbContext.queryVisitor;
        const entityExp = new EntityExpression(this.type, visitor.newAlias());

        const valueExp: SetterObj<TE> = {};
        const setterExp: SetterObj<TE> = {};
        for (const prop in item) {
            valueExp[prop] = new ValueExpression(item[prop]);
            setterExp[prop] = null;
        }
        const upsertExp = new UpsertExpression(entityExp, [valueExp], setterExp);

        const timer = Diagnostic.timer();
        const flatParams = this.flatQueryParameter({ index: 0 });
        const params = this.buildParameter(upsertExp, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.time()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, upsertExp, params, (resultMap) => Enumerable.from(resultMap).sum((o) => o[1].effectedRows), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public fromSql(strings: TemplateStringsArray, ...values: ValueType[]): Queryable<TE> {
        return new RawQueryable(strings, values, this);
    }
    public entry(entity: TE | FlatObjectLike<TE>) {
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
                entry = new EntityEntry<TE>(this, entityType, key);
                entry.setOriginalValues(entity);
            }
            else {
                entry = new EntityEntry<TE>(this, entity, key);
            }
            this.dictionary.set(key, entry);
        }
        return entry;
    }
    public override async find(predicate?: (item: QueryableChain<TE>) => boolean): Promise<TE>;
    public override async find(id: ValueType | FlatObjectLike<TE>, forceReload?: boolean): Promise<TE>;
    public override async find(idOrPredicate?: ValueType | FlatObjectLike<TE> | ((item: QueryableChain<TE>) => boolean), forceReload?: boolean) {
        let entity: TE;
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
    public findLocal(id: ValueType | FlatObjectLike<TE>): TE {
        const key = this.getKey(id);
        const entry = this.dictionary.get(key);
        return entry ? entry.entity : undefined;
    }
    public getKey(id: ValueType | FlatObjectLike<TE>): string {
        if (isNull(id)) {
            throw new Error("Parameter cannot be null");
        }
        if (isValue(id)) {
            return (id as string).toString();
        }

        let keyString = "";
        let useReference = false;
        for (const o of this.primaryKeys) {
            const val = id[o.propertyName as keyof FlatObjectLike<TE>];
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

    public async insert(...items: Array<FlatObjectLike<TE>>) {
        const query = this.deferredInsert(...items);
        return await query.execute();
    }
    public new(objectValue: FlatObjectLike<TE>): TE;
    public new(primaryValue: ValueType): TE;
    public new(primaryValue: ValueType | FlatObjectLike<TE>) {
        const entity = new this.type();
        if (isValue(primaryValue)) {
            if (this.primaryKeys.length !== 1) {
                throw new Error(`${this.type.name} has multiple primary keys`);
            }

            entity[this.primaryKeys.find(() => true).propertyName] = primaryValue as TE[StringKeyOf<TE>];
        }
        else {
            if (this.primaryKeys.some((o) => !(o.generation & ColumnGeneration.Insert) && !o.defaultExp && !primaryValue[o.propertyName as keyof FlatObjectLike<TE>])) {
                throw new Error(`Primary keys is required`);
            }

            for (const prop in primaryValue) {
                entity[prop as StringKeyOf<TE>] = primaryValue[prop];
            }
        }
        this.dbContext.add(entity);
        return entity;
    }
    public updateEntryKey(entry: EntityEntry<TE>) {
        this.dictionary.delete(entry.key);
        entry.key = this.getKey(entry.entity);
        this.dictionary.set(entry.key, entry);
    }

    public async upsert(item: FlatObjectLike<TE>) {
        const query = this.deferredUpsert(item);
        return await query.execute();
    }
}
