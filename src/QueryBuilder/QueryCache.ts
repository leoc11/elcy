import { IQueryResultParser } from "./ResultParser/IQueryResultParser";

export class QueryCache<T = any> {
    constructor(query: string, queryParser: IQueryResultParser<T>) {
        this.query = query;
        this.queryParser = queryParser;
    }
    public query: string;
    public queryParser: IQueryResultParser<T>;
}