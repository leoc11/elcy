import { IEnumerable } from "../Enumerable/IEnumerable";
import { IQueryResult } from "../Query/IQueryResult";
import { ICacheItem } from "./ICacheItem";
import { ICacheOption } from "./ICacheOption";
import { IResultCacheManager } from "./IResultCacheManager";

export class DefaultResultCacheManager implements IResultCacheManager {
    private _keyMap = new Map<string, [ICacheItem, any]>();
    private _tagMap = new Map<string, string[]>();
    public async clear(): Promise<void> {
        const titems = Array.from(this._keyMap.values());
        for (const titem of titems) {
            clearTimeout(titem[1]);
        }
        this._keyMap.clear();
        this._tagMap.clear();
    }
    public async get(key: string): Promise<IQueryResult[]> {
        const res = await this.gets([key]);
        return res.first();
    }
    public async gets(keys: IEnumerable<string>): Promise<IQueryResult[][]> {
        return keys.select((key) => {
            const titem = this._keyMap.get(key);
            if (!titem) {
                return null;
            }

            const item = titem[0];
            if (!item) {
                return null;
            }

            if (item.slidingExpiration) {
                const expiredDate = (new Date()).addMilliseconds(item.slidingExpiration.totalMilliSeconds());
                if (item.expiredTime < expiredDate) {
                    item.expiredTime = expiredDate;
                    if (item.expiredTime) {
                        titem[1] = clearTimeout(titem[1]);
                        titem[1] = setTimeout(() => this.remove([item.key]), item.expiredTime.getTime() - Date.now());
                    }
                }
            }

            return item.data;
        }).toArray();
    }
    public async remove(keys: IEnumerable<string>): Promise<void> {
        for (const key of keys) {
            const titem = this._keyMap.get(key);
            const item = titem[0];
            this._keyMap.delete(key);
            if (item) {
                if (item.tags) {
                    for (const tag of item.tags) {
                        const keyList = this._tagMap.get(tag);
                        if (keyList) {
                            keyList.delete(key);
                        }
                    }
                }
                clearTimeout(titem[1]);
            }
        }
    }
    public async removeTag(tags: IEnumerable<string>): Promise<void> {
        for (const tag of tags) {
            const keys = this._tagMap.get(tag);
            if (keys) {
                this._tagMap.delete(tag);
                for (const key of keys) {
                    this._keyMap.delete(key);
                }
            }
        }
    }
    public async set(key: string, cache: IQueryResult[], option?: ICacheOption): Promise<void> {
        const item = {} as ICacheItem<IQueryResult[]>;
        if (option) {
            Object.assign(item, option);
        }
        item.data = cache;
        item.key = key;
        const titem: [ICacheItem, any] = [item, null];
        this._keyMap.set(key, titem);
        if (!item.expiredTime && item.slidingExpiration) {
            item.expiredTime = (new Date()).addMilliseconds(item.slidingExpiration.totalMilliSeconds());
        }
        if (item.expiredTime) {
            titem[1] = setTimeout(() => this.remove([item.key]), item.expiredTime.getTime() - Date.now());
        }
        if (item.tags) {
            for (const tag of item.tags) {
                let tagList = this._tagMap.get(tag);
                if (!tagList) {
                    tagList = [];
                    this._tagMap.set(tag, tagList);
                }
                tagList.push(key);
            }
        }
    }
}
