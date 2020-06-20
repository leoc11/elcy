import { IEnumerable } from "../Enumerable/IEnumerable";
import { IQueryResult } from "../Query/IQueryResult";
import { ICacheOption } from "./ICacheOption";

export interface IResultCacheManager {
    clear(): Promise<void>;
    get(key: string): Promise<IQueryResult[]>;
    gets(keys: IEnumerable<string>): Promise<IQueryResult[][]>;
    remove(keys: IEnumerable<string>): Promise<void>;
    removeTag(tags: IEnumerable<string>): Promise<void>;
    set(key: string, cache: IQueryResult[], option?: ICacheOption): Promise<void>;
}
