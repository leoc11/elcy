import { DbContext } from "../Data/DBContext";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryResult } from "./IQueryResult";

export interface IQueryResultParser<T = any> {
    queryBuilder: IQueryBuilder;
    queryExpression: IQueryExpression<T>;
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[];
}
