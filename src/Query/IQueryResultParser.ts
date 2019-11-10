import { DbContext } from "../Data/DbContext";
import { QueryExpression } from "../Queryable/QueryExpression/QueryExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryResult } from "./IQueryResult";

export interface IQueryResultParser<T = any> {
    queryBuilder: IQueryBuilder;
    queryExpression: QueryExpression<T[]>;
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[];
}
