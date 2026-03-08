import { IQueryCache } from "./IQueryCache";

export interface IQueryCacheManager {
    clear(): void;
    get<T = unknown>(key: number): IQueryCache<T> | undefined;
    set<T>(key: number, cache: IQueryCache<T>): void;
}
