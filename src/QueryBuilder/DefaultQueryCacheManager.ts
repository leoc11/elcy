import { IQueryCache } from "./IQueryCache";
import { IQueryCacheManager } from "./IQueryCacheManager";
import { IObjectType } from "../Common/Type";
import { DbContext } from "../Data/DBContext";

export const queryCacheKey = Symbol("querycache-key");
export const expressionCacheKey = Symbol("expressioncache-key");
export class DefaultQueryCacheManager implements IQueryCacheManager {
    constructor(protected type: IObjectType<DbContext>) {

    }
    public get(key: number) {
        return Reflect.getOwnMetadata(queryCacheKey, this.type, key.toString());
    }
    public set<T>(key: number, cache: IQueryCache) {
        Reflect.defineMetadata(queryCacheKey, cache, this.type, key.toString());
    }
}