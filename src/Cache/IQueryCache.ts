import { IQueryResultParser } from "../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryCommandExpression } from "../Queryable/QueryExpression/IQueryCommandExpression";

export interface IQueryCache<T = any> {
    commandQuery: IQueryCommandExpression<T>;
    resultParser?: IQueryResultParser<T>;
}