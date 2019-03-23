import { DbContext } from "../../Data/DBContext";
import { IQueryResult } from "../../Query/IQueryResult";

export interface IQueryResultParser<T = any> {
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[];
}