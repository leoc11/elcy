import { DbContext } from "../../Data/DBContext";
import { IQueryResult } from "../IQueryResult";

export interface IQueryResultParser<T = any> {
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[];
}