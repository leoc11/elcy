import { hashCode } from "../Helper/Hash";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable.internal";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { RawEntityExpression } from "./QueryExpression/RawEntityExpression";
import { GenericType, IObjectType, RawSchema, StringKeyOf, ValueType } from "../Common/Type";
import { DbSet } from "../Data/DbSet";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { DeleteMode } from "../Common/StringType";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { Querify } from "./Interface/Querify";
import { DeferredQuery } from "../Query/DeferredQuery";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { DbContext } from "../Data/DbContext";
import { CustomColumnMetaData } from "../MetaData/CustomColumnMetaData";

export class RawQueryable<TE extends object> extends Queryable<TE> {
    declare public type: IObjectType<TE>;
    constructor(sqlTemplateStrings: TemplateStringsArray, values: unknown[], dbSet: DbSet<TE>);
    constructor(sqlTemplateStrings: TemplateStringsArray, values: unknown[], objectType: RawSchema, context: DbContext);
    constructor(public readonly sqlTemplateStrings: TemplateStringsArray, public readonly values: unknown[], objectTypeOrDbSet: RawSchema | DbSet<TE>, context?: DbContext) {
        let dbSet: DbSet<TE>;
        let objectType: Record<string, GenericType<ValueType>>;
        if (objectTypeOrDbSet instanceof DbSet) {
            dbSet = objectTypeOrDbSet;
            context = dbSet.dbContext;
        }
        else {
            objectType = objectTypeOrDbSet;
        }
        super(dbSet?.type ?? Object as unknown as IObjectType<TE>, dbSet);
        this._dbContext = context;
        this.isView = !dbSet;
        if (dbSet) {
            this._metaData = dbSet.metaData;
        }
        else if (objectType) {
            const objectMetaData = new EntityMetaData(this.type);
            for (const prop in objectType) {
                const columnMeta = new CustomColumnMetaData(objectMetaData, objectType[prop]);
                columnMeta.propertyName = prop as StringKeyOf<TE>;
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
    public override get dbContext(): DbContext {
        return this._dbContext;
    }

    private _metaData: EntityMetaData<TE>;
    public override flatQueryParameter(param?: { index: number }) {
        const flatParam = this.parent?.flatQueryParameter(param) ?? {};
        for (const prop in this.values) {
            flatParam[`${param.index}:${prop}`] = this.values[prop];
        }
        return flatParam;
    }
    public buildQuery(visitor: IQueryVisitor): IQueryExpression<TE> {
        if (typeof visitor.parameterIndex !== "number") {
            visitor.parameterIndex = 0;
        }
        const valueParameters: ParameterExpression[] = [];
        for (const prop in this.values) {
            const paramExp = new ParameterExpression(`${visitor.parameterIndex}:${prop}`, this.values[prop]?.constructor as GenericType);
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
    override delete(predicate?: FunctionExpression<boolean, [TE]>, mode?: DeleteMode): Promise<number>;
    override delete(predicate?: (item: Querify<TE>) => boolean, mode?: DeleteMode): Promise<number>;
    override delete(modeOrPredicate?: DeleteMode | FunctionExpression<boolean, [TE]> | ((item: Querify<TE>) => boolean), mode?: DeleteMode): Promise<number> {
        throw new Error("not supported");
    }
    override deferredDelete(mode?: DeleteMode): DeferredQuery<number>;
    override deferredDelete(predicate?: FunctionExpression<boolean, [TE]>, mode?: DeleteMode): DeferredQuery<number>;
    override deferredDelete(predicate?: (item: Querify<TE>) => boolean, mode?: DeleteMode): DeferredQuery<number>;
    override deferredDelete(modeOrPredicate?: DeleteMode | FunctionExpression<boolean, [TE]> | ((item: Querify<TE>) => boolean), mode?: DeleteMode): DeferredQuery<number> {
        if (this.isView) {
            throw new Error("not supported");
        }
        return super.deferredDelete(modeOrPredicate as FunctionExpression<boolean, [TE]>, mode);
    }
    override deferredUpdate(setter: { [TK in keyof TE]?: Extract<ValueType, TE[TK]> | ((item: Querify<TE>) => Extract<ValueType, TE[TK]>) }): DeferredQuery<number> {
        if (this.isView) {
            throw new Error("not supported");
        }
        return super.deferredUpdate(setter);
    }
    override withRelated<TLoad extends object>(...includes: Array<FunctionExpression<TLoad extends ValueType ? never: TLoad, [TE]>>): Queryable<TE>;
    override withRelated<TLoad extends object>(...includes: Array<(item: Querify<TE>) => TLoad extends ValueType ? never: TLoad>): Queryable<TE>;
    override withRelated<TLoad extends object>(...includes: Array<FunctionExpression<TLoad extends ValueType ? never: TLoad, [TE]> | ((item: Querify<TE>) => TLoad extends ValueType ? never: TLoad)>): Queryable<TE> {
        if (this.isView) {
            throw new Error("not supported");
        }
        return super.withRelated(...includes);
    }
}