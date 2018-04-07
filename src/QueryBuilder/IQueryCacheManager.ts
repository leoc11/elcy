import { IQueryResultParser } from "./ResultParser/IQueryResultParser";
import { QueryCache } from "./QueryCache";
import { IObjectType } from "../Common/Type";
import { DbContext } from "../Linq/DBContext";

export interface IQueryCacheManager {
    get<T>(type: IObjectType<DbContext>, key: string): Promise<QueryCache<T> | undefined>;
    set<T>(type: IObjectType<DbContext>, key: string, query: string, queryas: IQueryResultParser<T>): Promise<void>;
}