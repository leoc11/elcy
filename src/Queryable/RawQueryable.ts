import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { RawEntityExpression } from "./QueryExpression/RawEntityExpression";
import { GenericType, IObjectType, RawSchema, StringKeyOf, ValueType } from "../Common/Type";
import { DbSet } from "../Data/DbSet";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { DeleteMode } from "../Common/StringType";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { QueryableChain } from "./Interface/QueryableChain";
import { DeferredQuery } from "../Query/DeferredQuery";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { DbContext } from "../Data/DbContext";
import { CustomColumnMetaData } from "../MetaData/CustomColumnMetaData";

export class RawQueryable<T extends object> extends Queryable<T> {
    declare public type: IObjectType<T>;
    constructor(sqlTemplateStrings: TemplateStringsArray, values: any[], dbSet: DbSet<T>);
    constructor(sqlTemplateStrings: TemplateStringsArray, values: any[], objectType: RawSchema, context: DbContext);
    constructor(public readonly sqlTemplateStrings: TemplateStringsArray, public readonly values: any[], objectTypeOrDbSet: RawSchema | DbSet<T>, context?: DbContext) {
        let dbSet: DbSet<T>;
        let objectType: Record<string, GenericType<ValueType>>;
        if (objectTypeOrDbSet instanceof DbSet) {
            dbSet = objectTypeOrDbSet;
            context = dbSet.dbContext;
        }
        else {
            objectType = objectTypeOrDbSet;
        }
        super(dbSet?.type ?? Object as unknown as IObjectType<T>, dbSet as any);
        this._dbContext = context;
        this.isView = !dbSet;
        if (dbSet) {
            this._metaData = dbSet.metaData;
        }
        else if (objectType) {
            const objectMetaData = new EntityMetaData(this.type);
            for (const prop in objectType) {
                const columnMeta = new CustomColumnMetaData(objectMetaData, objectType[prop]);
                columnMeta.propertyName = prop as StringKeyOf<T>;
                columnMeta.columnName = String(prop);
                columnMeta.nullable = true;
                columnMeta.isProjected = true;
                objectMetaData.columns.push(columnMeta);
            }
            this._metaData = objectMetaData;
        }
    }

    protected isView: boolean;
    private _dbContext: DbContext;
    public get dbContext(): DbContext {
        return this._dbContext;
    }

    private _metaData: EntityMetaData<T>;
    public flatQueryParameter(param?: { index: number }) {
        const flatParam = this.parent?.flatQueryParameter(param) ?? {};
        for (const prop in this.values) {
            flatParam[`${param.index}:${prop}`] = this.values[prop];
        }
        return flatParam;
    }
    public buildQuery(visitor: IQueryVisitor): IQueryExpression<T> {
        if (typeof visitor.parameterIndex !== "number") {
            visitor.parameterIndex = 0;
        }
        const valueParameters: ParameterExpression[] = [];
        for (const prop in this.values) {
            const paramExp = new ParameterExpression(`${visitor.parameterIndex}:${prop}`, this.values[prop]?.constructor);
            valueParameters.push(paramExp);
        }
        const entityExp = new RawEntityExpression(this._metaData, visitor.newAlias(), this.sqlTemplateStrings);
        const result = new SelectExpression(entityExp);
        for (const paramExp of valueParameters) {
            const sqlParamExp = result.addSqlParameter(paramExp);
            entityExp.addParameter(sqlParamExp);
        }
        visitor.setDefaultBehaviour(result);
        return result;
    }
    public hashCode() {
        return hashCode(this.type.name, hashCode(this.sqlTemplateStrings.join("?")));
    }

    override delete(mode?: DeleteMode): Promise<number>;
    override delete(predicate?: FunctionExpression<boolean, T>, mode?: DeleteMode): Promise<number>;
    override delete(predicate?: (item: QueryableChain<T>) => boolean, mode?: DeleteMode): Promise<number>;
    override delete(modeOrPredicate?: DeleteMode | FunctionExpression<boolean, T> | ((item: QueryableChain<T>) => boolean), mode?: DeleteMode): Promise<number> {
        throw new Error("not supported");
    }
    override deferredDelete(mode?: DeleteMode): DeferredQuery<number>;
    override deferredDelete(predicate?: FunctionExpression<boolean, T>, mode?: DeleteMode): DeferredQuery<number>;
    override deferredDelete(predicate?: (item: QueryableChain<T>) => boolean, mode?: DeleteMode): DeferredQuery<number>;
    override deferredDelete(modeOrPredicate?: DeleteMode | FunctionExpression<boolean, T> | ((item: QueryableChain<T>) => boolean), mode?: DeleteMode): DeferredQuery<number> {
        if (this.isView) {
            throw new Error("not supported");
        }
        return super.deferredDelete(modeOrPredicate as FunctionExpression<boolean, T>, mode);
    }
    override deferredUpdate(setter: { [key in keyof T]?: T[key] | ((item: QueryableChain<T>) => ValueType); }): DeferredQuery<number> {
        if (this.isView) {
            throw new Error("not supported");
        }
        return super.deferredUpdate(setter);
    }
    override loads<TLoad extends object>(...includes: Array<FunctionExpression<TLoad extends ValueType ? never: TLoad, T>>): Queryable<T>;
    override loads<TLoad extends object>(...includes: Array<(item: QueryableChain<T>) => TLoad extends ValueType ? never: TLoad>): Queryable<T>;
    override loads<TLoad extends object>(...includes: Array<FunctionExpression<TLoad extends ValueType ? never: TLoad, T> | ((item: QueryableChain<T>) => TLoad extends ValueType ? never: TLoad)>): Queryable<T> {
        if (this.isView) {
            throw new Error("not supported");
        }
        return super.loads(...includes);
    }
}