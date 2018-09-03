import { IResultCacheManager } from "./IResultCacheManager";
import { IQueryResult } from "../QueryBuilder/IQueryResult";
import { ICacheOption } from "./ICacheOption";
import { ICacheItem } from "./ICacheItem";
import { QueuedTimeout } from "../Common/QueuedTimeout";

export class DefaultResultCacheManager implements IResultCacheManager {
    private _keyMap = new Map<string, ICacheItem>();
    private _tagMap = new Map<string, string[]>();
    private _expiredQueue = new QueuedTimeout((item: ICacheItem) => {
        return this.remove(item.key);
    });
    public async get(key: string): Promise<IQueryResult[]> {
        const res = await this.gets(key);
        return res.first();
    }
    public async gets(...keys: string[]): Promise<IQueryResult[][]> {
        return keys.select(key => {
            const item = this._keyMap.get(key);
            if (item.slidingExpiration) {
                const expiredDate = (new Date()).addMilliseconds(item.slidingExpiration.totalMilliSeconds());
                if (item.expiredTime < expiredDate) {
                    item.expiredTime = expiredDate;
                    this._expiredQueue.clearTimeout(item);
                    this._expiredQueue.setTimeout(item, item.expiredTime);
                }
            }

            return item ? item.data : null;
        }).toArray();
    }
    public async set(key: string, cache: IQueryResult[], option?: ICacheOption): Promise<void> {
        const item = {} as ICacheItem<IQueryResult[]>;
        if (option) Object.assign(item, option);
        item.data = cache;
        item.key = key;
        this._keyMap.set(key, item);
        if (!item.expiredTime && item.slidingExpiration) {
            item.expiredTime = (new Date()).addMilliseconds(item.slidingExpiration.totalMilliSeconds());
        }
        if (item.expiredTime) {
            this._expiredQueue.setTimeout(item, item.expiredTime);
        }
        if (item.tags) {
            item.tags.each((tag) => {
                let tagList = this._tagMap.get(tag);
                if (!tagList) {
                    tagList = [];
                    this._tagMap.set(tag, tagList);
                }
                tagList.push(key);
            });
        }
    }
    public async remove(...keys: string[]): Promise<void> {
        keys.each(key => {
            const item = this._keyMap.get(key);
            this._keyMap.delete(key);
            if (item) {
                if (item.tags) {
                    item.tags.each((tag) => {
                        const keyList = this._tagMap.get(tag);
                        if (keyList) {
                            keyList.remove(key);
                        }
                    });
                }
                this._expiredQueue.clearTimeout(item);
            }
        });
    }
    public async removeTag(...tags: string[]): Promise<void> {
        tags.each(tag => {
            const keyList = this._tagMap.get(tag);
            if (keyList) {
                this._tagMap.delete(tag);
                keyList.each((key) => {
                    this._keyMap.delete(key);
                });
            }
        });
    }
    public async clear(): Promise<void> {
        this._keyMap.clear();
        this._tagMap.clear();
        this._expiredQueue.reset();
    }
}