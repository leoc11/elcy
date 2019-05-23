import { ICompleteColumnType } from "../Common/ICompleteColumnType";
import { ValueType } from "../Common/Type";
import { IQueryLimit } from "../Data/Interface/IQueryLimit";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQuery } from "./IQuery";
import { IQueryBuilderParameter } from "./IQueryBuilderParameter";
import { IQueryOption } from "./IQueryOption";
import { IQueryParameterMap } from "./IQueryParameter";
import { NamingStrategy } from "./NamingStrategy";

export interface IQueryBuilder {
    queryLimit: IQueryLimit;
    namingStrategy: NamingStrategy;
    lastInsertIdQuery: string;
    toQuery<T>(queryExp: IQueryExpression<T>, parameters?: IQueryParameterMap, option?: IQueryOption): IQuery[];
    toString<T = any>(exp: IExpression<T>, param: IQueryBuilderParameter): string;
    toOperandString(exp: IExpression, param: IQueryBuilderParameter): string;
    toLogicalString(exp: IExpression<boolean>, param: IQueryBuilderParameter): string;
    valueString(value: ValueType): string;
    columnTypeString(columnType: ICompleteColumnType): string;

    // TODO: Remove
    newLine(indent?: number, isAdd?: boolean): string;
    mergeQueries(queries: IEnumerable<IQuery>): IQuery[];
    toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T;
    toParameterValue(input: any, column: IColumnMetaData): any;
}
