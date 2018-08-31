import { IResultCacheManager } from "./IResultCacheManager";
import { IQueryResult } from "../QueryBuilder/IQueryResult";
import { ICacheOption } from "./ICacheOption";
import { ICacheItem } from "./ICacheItem";

export class DefaultResultCacheManager implements IResultCacheManager {
    private _keyMap = new Map<string, ICacheItem>();
    private _tagMap = new Map<string, string[]>();
    private _expiredSortedItems: ICacheItem[] = [];
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
                    const index = this._expiredSortedItems.indexOf(item);
                    this._expiredSortedItems.splice(index, 1);
                    this.addSortedItem(item);
                    if (index === 0) {
                        this.clearExpiredTimeout();
                    }
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
            this.addSortedItem(item);
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
    public async remove(key: string): Promise<void> {
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
            this._expiredSortedItems.remove(item);
        }
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
        this._expiredSortedItems = [];
        this.clearExpiredTimeout();
    }
    private _expiredTimeout: any;
    protected setExpiredTimeout(expiredTime: Date) {
        if (!this._expiredTimeout) {
            this._expiredTimeout = setTimeout(() => {
                const item = this._expiredSortedItems.shift();
                this._expiredTimeout = null;
                this.remove(item.key).then(() => {
                    if (this._expiredSortedItems.length)
                        this.setExpiredTimeout(this._expiredSortedItems[0].expiredTime);
                });
            }, Date.now() - expiredTime.getTime());
        }
    }
    protected clearExpiredTimeout() {
        if (this._expiredTimeout) {
            clearTimeout(this._expiredTimeout);
            this._expiredTimeout = null;
            if (this._expiredSortedItems.length > 0)
                this.setExpiredTimeout(this._expiredSortedItems[0].expiredTime);
        }
    }
    protected addSortedItem(item: ICacheItem, start = 0, end = this._expiredSortedItems.length - 1) {
        while (start < end) {
            const half = Math.floor(start + end / 2);
            const halfItem = this._expiredSortedItems[half];
            if (item.expiredTime > halfItem.expiredTime) {
                start = start === half ? half + 1 : half;
            }
            else if (item.expiredTime < halfItem.expiredTime) {
                end = half;
            }
            else {
                start = end = half;
            }
        }
        this._expiredSortedItems.splice(start, 0, item);
    }
}
