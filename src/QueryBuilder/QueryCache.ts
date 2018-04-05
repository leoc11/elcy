import { IQueryResultParser } from "./ResultParser/IQueryResultParser";

export class QueryCache<T = any> {
    public query: string;
    public queryParser: IQueryResultParser<T>;
}