import { DbContext } from "../../Linq/DBContext";
import { IQueryResult } from "../QueryResult";

export interface IQueryResultParser<T = any> {
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[];
}