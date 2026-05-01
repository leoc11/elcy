import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { QueuedTimeout } from "../Common/QueuedTimeout";
import { IQueryResult } from "../Query/IQueryResult";
import { ICacheItem } from "./ICacheItem";
import { ICacheOption } from "./ICacheOption";
import { IResultCacheManager } from "./IResultCacheManager";
import { DbFunction } from "src/Query/DbFunction";

export class DefaultResultCacheManager implements IResultCacheManager {
    private _expiredQueue = new QueuedTimeout((item: ICacheItem) => {
        return this.remove(item.key);
    });
    private _keyMap = new Map<string, ICacheItem<IQueryResult[]>>();
    private _tagMap = new Map<string, string[]>();
    public async clear(): Promise<void> {
        this._keyMap.clear();
        this._tagMap.clear();
        await this._expiredQueue.reset();
    }
    public async get(key: string): Promise<IQueryResult[]> {
        const res = await this.gets(key);
        return res.find(() => true);
    }
    public gets(...keys: string[]): Promise<IQueryResult[][]> {
        return Promise.resolve(keys.map((key) => {
            const item = this._keyMap.get(key);
            if (item && item.slidingExpiration) {
                const expiredDate = DbFunction.dateAdd(new Date(), { milliseconds: item.slidingExpiration.totalMilliSeconds() });
                if (item.expiredTime < expiredDate) {
                    item.expiredTime = expiredDate;
                    this._expiredQueue.clearTimeout(item);
                    this._expiredQueue.setTimeout(item, item.expiredTime);
                }
            }

            return item ? item.data : null;
        }));
    }
    public remove(...keys: string[]): Promise<void> {
        for (const key of keys) {
            const item = this._keyMap.get(key);
            this._keyMap.delete(key);
            if (item) {
                if (item.tags) {
                    for (const tag of item.tags) {
                        const keyList = this._tagMap.get(tag);
                        if (keyList) {
                            ArrayExtension.delete(keyList, key);
                        }
                    }
                }
                this._expiredQueue.clearTimeout(item);
            }
        }
        return Promise.resolve();
    }
    public removeTag(...tags: string[]): Promise<void> {
        for (const tag of tags) {
            const keys = this._tagMap.get(tag);
            if (keys) {
                this._tagMap.delete(tag);
                for (const key of keys) {
                    this._keyMap.delete(key);
                }
            }
        }

        return Promise.resolve();
    }
    public set(key: string, cache: IQueryResult[], option?: ICacheOption): Promise<void> {
        const item = {} as ICacheItem<IQueryResult[]>;
        if (option) {
            Object.assign(item, option);
        }
        item.data = cache;
        item.key = key;
        this._keyMap.set(key, item);
        if (!item.expiredTime && item.slidingExpiration) {
            item.expiredTime = DbFunction.dateAdd(new Date(), { milliseconds: item.slidingExpiration.totalMilliSeconds() });
        }
        if (item.expiredTime) {
            this._expiredQueue.setTimeout(item, item.expiredTime);
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

        return Promise.resolve();
    }
}
