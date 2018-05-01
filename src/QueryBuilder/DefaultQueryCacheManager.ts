import { IQueryResultParser } from "./ResultParser/IQueryResultParser";
import { QueryCache } from "./QueryCache";
import { IQueryCacheManager } from "./IQueryCacheManager";
import { IObjectType } from "../Common/Type";
import { DbContext } from "../Data/DBContext";
import { ParameterBuilder } from "./ParameterBuilder/ParameterBuilder";
import { IQueryCommand } from "./Interface/IQueryCommand";

export const queryCacheKey = Symbol("querycache-key");
export class DefaultQueryCacheManager implements IQueryCacheManager {
    public async get(type: IObjectType<DbContext>, key: number) {
        const cached: Map<number, QueryCache> = Reflect.getOwnMetadata(queryCacheKey, type);
        if (cached && cached.has(key))
            return Promise.resolve(cached.get(key));
        return Promise.resolve(undefined);
    }
    public async set<T>(type: IObjectType<DbContext>, key: number, queryCommands: IQueryCommand[], queryParser: IQueryResultParser<T>, parameterBuilder: ParameterBuilder) {
        let cached: Map<number, QueryCache> = Reflect.getOwnMetadata(queryCacheKey, type);
        if (!cached) {
            cached = new Map<number, QueryCache>();
            Reflect.defineMetadata(queryCacheKey, cached, type);
        }
        cached.set(key, new QueryCache(queryCommands, queryParser, parameterBuilder));
        return Promise.resolve();
    }
}