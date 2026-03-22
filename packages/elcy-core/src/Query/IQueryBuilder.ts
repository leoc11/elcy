import { ICompleteColumnType } from "../Common/ICompleteColumnType";
import { ValueType } from "../Common/Type";
import { IQueryLimit } from "../Data/Interface/IQueryLimit";
import { IEnumerable } from "@elcy/enumerable";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQuery } from "./IQuery";
import { IQueryBuilderParameter } from "./IQueryBuilderParameter";
import { IQueryOption } from "./IQueryOption";
import { IQueryParameterMap } from "./IQueryParameter";
import { NamingStrategy } from "./NamingStrategy";

export interface IQueryBuilder {
    lastInsertIdQuery: string;
    namingStrategy: NamingStrategy;
    queryLimit: IQueryLimit;
    columnTypeString(columnType: ICompleteColumnType): string;
    mergeQueries(queries: IEnumerable<IQuery>): IQuery[];

    // TODO: Remove
    newLine(indent?: number, isAdd?: boolean): string;
    toLogicalString(exp: IExpression<boolean>, param?: IQueryBuilderParameter): string;
    toOperandString(exp: IExpression, param?: IQueryBuilderParameter): string;
    toParameterValue(input: unknown, column: IColumnMetaData<any, unknown>): unknown;
    toPropertyValue<T>(input: unknown, column: IColumnMetaData<any, T>): T;
    toQuery<T = unknown>(queryExp: IQueryExpression<T>, parameters?: IQueryParameterMap, option?: IQueryOption): IQuery[];
    toString<T = unknown>(exp: IExpression<T>, param?: IQueryBuilderParameter): string;
    valueString(value: ValueType): string;
}
