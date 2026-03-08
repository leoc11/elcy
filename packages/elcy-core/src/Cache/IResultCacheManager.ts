import { IQueryResult } from "../Query/IQueryResult";
import { ICacheOption } from "./ICacheOption";

export interface IResultCacheManager {
    clear(): Promise<void>;
    get(key: string): Promise<IQueryResult[]>;
    gets(...keys: string[]): Promise<IQueryResult[][]>;
    remove(...key: string[]): Promise<void>;
    removeTag(...tag: string[]): Promise<void>;
    set(key: string, cache: IQueryResult[], option?: ICacheOption): Promise<void>;
}
