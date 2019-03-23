import { IQueryResultParser } from "../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryStatementExpression";

export interface IQueryCache<T = any> {
    commandQuery: IQueryExpression<T>;
    resultParser?: IQueryResultParser<T>;
}