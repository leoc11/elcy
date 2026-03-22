import { IEnumerable } from "@elcy/enumerable";
import { DbContext } from "../Data/DbContext";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryResult } from "./IQueryResult";

export interface IQueryResultParser<T = unknown> {
    queryBuilder: IQueryBuilder;
    queryExpression: IQueryExpression;
    parse(queryResults: IQueryResult[], dbContext: DbContext): IEnumerable<T>;
}
