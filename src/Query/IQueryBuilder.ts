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
    lastInsertIdQuery: string;
    namingStrategy: NamingStrategy;
    queryLimit: IQueryLimit;
    columnTypeString(columnType: ICompleteColumnType): string;
    mergeQueries(queries: IEnumerable<IQuery>): IQuery[];

    // TODO: Remove
    newLine(indent?: number, isAdd?: boolean): string;
    toLogicalString(exp: IExpression<boolean>, param?: IQueryBuilderParameter): string;
    toOperandString(exp: IExpression, param?: IQueryBuilderParameter): string;
    toParameterValue(input: any, column: IColumnMetaData): any;
    toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T;
    toQuery<T>(queryExp: IQueryExpression<T>, parameters?: IQueryParameterMap, option?: IQueryOption): IQuery[];
    toString<T = any>(exp: IExpression<T>, param?: IQueryBuilderParameter): string;
    valueString(value: ValueType): string;
}
