import { IQueryResultParser } from "./ResultParser/IQueryResultParser";
import { QueryCache } from "./QueryCache";
import { IQueryCacheManager } from "./IQueryCacheManager";
import { IObjectType } from "../Common/Type";
import { DbContext } from "../Linq/DBContext";

export const queryCacheKey = Symbol("querycache-key");
export class DefaultQueryCacheManager implements IQueryCacheManager {
    public async get(type: IObjectType<DbContext>, key: number) {
        const cached: Map<number, QueryCache> = Reflect.getOwnMetadata(queryCacheKey, type);
        if (cached && cached.has(key))
            return Promise.resolve(cached.get(key));
        return Promise.resolve(undefined);
    }
    public async set<T>(type: IObjectType<DbContext>, key: number, query: string, queryParser: IQueryResultParser<T>) {
        let cached: Map<number, QueryCache> = Reflect.getOwnMetadata(queryCacheKey, type);
        if (!cached) {
            cached = new Map<number, QueryCache>();
            Reflect.defineMetadata(queryCacheKey, cached, type);
        }
        cached.set(key, new QueryCache(query, queryParser));
        return Promise.resolve();
    }
}