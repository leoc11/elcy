import { DbContext } from "../../Linq/DBContext";

export interface IQueryResultParser<T> {
    parse(rawResult: any[], dbContext: DbContext): T[];
}