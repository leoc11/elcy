import { ICompleteColumnType } from "../Common/ICompleteColumnType";
import { DbValue, ValueType } from "../Common/Type";
import { IQueryLimit } from "../Data/Interface/IQueryLimit";
import { IEnumerable } from "@elcy/enumerable";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQuery } from "./IQuery";
import { IQueryBuilderContext } from "./IQueryBuilderContext";
import { IQueryOption } from "./IQueryOption";
import { ISqlParameterValueMap } from "./IQueryParameter";
import { NamingStrategy } from "./NamingStrategy";

export interface IQueryBuilder {
    lastInsertIdQuery: string;
    namingStrategy: NamingStrategy;
    queryLimit: IQueryLimit;
    columnTypeString(columnType: ICompleteColumnType): string;
    mergeQueries(queries: IEnumerable<IQuery>): IQuery[];

    // TODO: Remove
    newLine(indent?: number, isAdd?: boolean): string;
    toLogicalString(exp: IExpression<boolean>, context?: IQueryBuilderContext): string;
    toOperandString(exp: IExpression, context?: IQueryBuilderContext): string;
    persistValue(value: unknown, column: IColumnMetaData<any, unknown>): unknown;
    hydrateValue<T>(value: DbValue, column: IColumnMetaData<any, T>): T;
    toQuery<T = unknown>(queryExp: IQueryExpression<T>, parameters?: ISqlParameterValueMap, option?: IQueryOption): IQuery[];
    toString<T = unknown>(exp: IExpression<T>, context?: IQueryBuilderContext): string;
    valueString(value: ValueType): string;
    extractValue<T>(exp: IExpression<T>, context?: IQueryBuilderContext): T | undefined;
}
