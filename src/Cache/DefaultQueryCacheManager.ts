import { IQueryCache } from "./IQueryCache";
import { IQueryCacheManager } from "./IQueryCacheManager";

export class DefaultQueryCacheManager implements IQueryCacheManager {
    private _cache: Map<number, IQueryCache> = new Map();
    constructor() { }
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