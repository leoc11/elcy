import { DbContext } from "../Data/DBContext";
import { IQueryResult } from "./IQueryResult";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";

export interface IQueryResultParser<T = any> {
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[];
    queryExpression: IQueryExpression<T>;
    queryBuilder: IQueryBuilder;
}