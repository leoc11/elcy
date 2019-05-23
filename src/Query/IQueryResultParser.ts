import { DbContext } from "../Data/DBContext";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryResult } from "./IQueryResult";

export interface IQueryResultParser<T = any> {
    queryExpression: IQueryExpression<T>;
    queryBuilder: IQueryBuilder;
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[];
}
