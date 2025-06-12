import { IQueryResultParser } from "../Query/IQueryResultParser";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";

export interface IQueryCache<T = unknown> {
    commandQuery: IQueryExpression<T>;
    resultParser?: IQueryResultParser<T>;
}
