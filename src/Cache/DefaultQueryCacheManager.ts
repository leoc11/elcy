import { IQueryCache } from "./IQueryCache";
import { IQueryCacheManager } from "./IQueryCacheManager";
import { IObjectType } from "../Common/Type";
import { DbContext } from "../Data/DBContext";

export class DefaultQueryCacheManager implements IQueryCacheManager {
    private _cache: Map<number, IQueryCache> = new Map();
    constructor(protected type: IObjectType<DbContext>) { }
    public get(key: number) {
        return this._cache.get(key);
    }
    public set<T>(key: number, cache: IQueryCache<T>) {
        return this._cache.set(key, cache);
    }
    public clear() {
        this._cache.clear();
    }
}