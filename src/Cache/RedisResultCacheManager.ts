import { IResultCacheManager } from "./IResultCacheManager";
import { IQueryResult } from "../QueryBuilder/IQueryResult";
import { ICacheOption } from "./ICacheOption";
import { ICacheItem } from "./ICacheItem";
import * as Redis from "ioredis";

export interface IRedisCacheOptions extends Redis.RedisOptions {
    /**
     * Milliseconds before an idle connection is closed. (default: 30000)
     */
    idleTimeout?: number;
}
export class RedisResultCacheManager implements IResultCacheManager {
    private option: IRedisCacheOptions;
    private _connection: Redis.Redis;
    private _idleTimeOut: any;
    protected get connection(): Redis.Redis {
        let con = this._connection;
        if (!con) {
            con = this._connection = new Redis(this.option);
        }
        if (this.option.idleTimeout && this.option.idleTimeout > 0 && this.option.idleTimeout !== Infinity) {
            if (this._idleTimeOut) {
                clearTimeout(this._idleTimeOut);
                this._idleTimeOut = null;
            }

            this._idleTimeOut = setTimeout(() => {
                this._connection = null;
                this._idleTimeOut = null;
                con.quit();
            }, this.option.idleTimeout);
        }
        return con;
    }
    constructor(option: IRedisCacheOptions) {
        this.option = option;
    }
    public async get(key: string): Promise<IQueryResult[]> {
        const res = await this.gets(key);
        return res.first();
    }
    public async gets(...keys: string[]): Promise<IQueryResult[][]> {
        const connection = this.connection;
        let pipeline = connection.pipeline();
        keys.each((key) => {
            pipeline.get(key);
        });

        const results: any[] = await pipeline.exec();
        let i = 0;
        const datas = results.select(o => o[1]).select(o => {
            if (!o) return null;
            const item = JSON.parse(o) as ICacheItem<IQueryResult[]>;
            if (item.slidingExpiration) {
                const expiredDate = (new Date()).addMilliseconds(item.slidingExpiration.totalMilliSeconds());
                if (item.expiredTime < expiredDate) {
                    pipeline.pexpire(keys[i], Date.now() - expiredDate.getTime());
                }
            }
            i++;
            return item.data;
        }).toArray();
        pipeline.exec();
        return datas;
    }
    public async set(key: string, cache: IQueryResult[], option?: ICacheOption): Promise<void> {
        const item = {} as ICacheItem<IQueryResult[]>;
        if (option) Object.assign(item, option);
        item.data = cache;
        const pipeline = this.connection.pipeline();
        if (item.expiredTime) {
            pipeline.set(key, JSON.stringify(item), "PX", item.expiredTime.getTime() - Date.now());
        }
        else {
            pipeline.set(key, JSON.stringify(item));
        }
        if (item.tags) {
            item.tags.each(o => {
                pipeline.sadd("tag:" + o, key);
            });
        }

        await pipeline.exec();
    }
    public async remove(...keys: string[]): Promise<void> {
        const pipeline = this.connection.pipeline();
        keys.each(key => pipeline.del(key));
        await pipeline.exec();
    }
    public async removeTag(...tags: string[]): Promise<void> {
        const pipeline = this.connection.pipeline();
        tags.each(tag => pipeline.smembers("tag:" + tag));
        const res: any[] = await pipeline.exec();
        const keys = res.selectMany(o => o as any[]).distinct().toArray();
        await this.remove(...keys);
    }
    public async clear(): Promise<void> {
        this.connection.flushdb();
    }
}
