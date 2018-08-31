import { IQueryResult } from "../QueryBuilder/IQueryResult";
import { ICacheOption } from "./ICacheOption";

export interface IResultCacheManager {
    get(key: string): Promise<IQueryResult[]>;
    gets(...keys: string[]): Promise<IQueryResult[][]>;
    set(key: string, cache: IQueryResult[], option?: ICacheOption): Promise<void>;
    clear(): Promise<void>;
    removeTag(...tag: string[]): Promise<void>;
    remove(...key: string[]): Promise<void>;
}
