import { IQueryLimit } from "../Data/Interface/IQueryLimit";
import { IQuery } from "./IQuery";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryStatementExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { ISqlParameter } from "../QueryBuilder/ISqlParameter";
import { NamingStrategy } from "../QueryBuilder/NamingStrategy";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IQueryBuilderParameter } from "./IQueryBuilderParameter";
import { ValueType } from "../Common/Type";
import { IQueryOption } from "../Queryable/QueryExpression/IQueryOption";
import { ICompleteColumnType } from "../Common/ICompleteColumnType";

export interface IQueryBuilder {
    queryLimit: IQueryLimit;
    namingStrategy: NamingStrategy;
    toQuery<T>(queryExp: IQueryExpression<T>, parameters?: ISqlParameter[], option?: IQueryOption): IQuery[];
    toString<T = any>(exp: IExpression<T>, param: IQueryBuilderParameter): string;
    toOperandString(exp: IExpression, param: IQueryBuilderParameter): string;
    toLogicalString(exp: IExpression<boolean>, param: IQueryBuilderParameter): string;
    valueString(value: ValueType): string;
    lastInsertIdQuery: string;
    columnTypeString(columnType: ICompleteColumnType): string;

    // TODO: Remove
    newLine(indent?: number, isAdd?: boolean): string;
    mergeQueries(queries: Iterable<IQuery>): IQuery[];
    toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T;
    toParameterValue(input: any, column: IColumnMetaData): any;
}