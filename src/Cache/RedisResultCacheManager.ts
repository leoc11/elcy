import { IResultCacheManager } from "./IResultCacheManager";
import { IQueryResult } from "../QueryBuilder/IQueryResult";
import { ICacheOption } from "./ICacheOption";
import { createClient, ClientOpts, RedisClient } from "redis";
import { ICacheItem } from "./ICacheItem";

export interface RedisOption extends ClientOpts {
    /**
     * Milliseconds before an idle connection is closed. (default: 30000)
     */
    idleTimeout?: number;
}
export class RedisResultCacheManager implements IResultCacheManager {
    private option: RedisOption;
    private _connection: RedisClient;
    private _idleTimeOut: any;
    protected get connection(): RedisClient {
        let con = this._connection;
        if (!con) {
            con = this._connection = createClient(this.option);
        }
        if (this._idleTimeOut) {
            clearTimeout(this._idleTimeOut);
            this._idleTimeOut = null;
        }
        if (this.option.idleTimeout && this.option.idleTimeout > 0) {
            this._idleTimeOut = setTimeout(() => {
                this._connection = null;
                this._idleTimeOut = null;
                con.QUIT();
            }, this.option.idleTimeout);
        }
        return con;
    }
    constructor(option: ClientOpts) {
        this.option = option;
        if (typeof this.option.idleTimeout !== "number" || this.option.idleTimeout === Infinity) this.option.idleTimeout = 30000;
    }
    public async get(key: string): Promise<IQueryResult[]> {
        const res = await this.gets(key);
        return res.first();
    }
    public gets(...keys: string[]): Promise<IQueryResult[][]> {
        let batch = this.connection.BATCH();
        keys.each((key) => {
            batch.GET(key);
        });
        return new Promise<IQueryResult[][]>((ok, fail) => {
            batch.EXEC((error, res) => {
                if (error) {
                    fail(error);
                    return;
                }
                batch = this.connection.BATCH();
                let i = 0;
                const datas = res.select(o => {
                    const item = JSON.parse(o) as ICacheItem<IQueryResult[]>;
                    if (item.slidingExpiration) {
                        const expiredDate = (new Date()).addMilliseconds(item.slidingExpiration.totalMilliSeconds());
                        if (item.expiredTime < expiredDate) {
                            batch.PEXPIRE(keys[i], Date.now() - expiredDate.getTime());
                        }
                    }
                    i++;
                    return item.data;
                }).toArray();
                ok(datas);
                batch.EXEC();
            });
        });
    }
    public set(key: string, cache: IQueryResult[], option?: ICacheOption): Promise<void> {
        const item = {} as ICacheItem<IQueryResult[]>;
        if (option) Object.assign(item, option);
        item.data = cache;
        const batch = this.connection.BATCH();
        if (option.expiredTime) {
            batch.SET(key, JSON.stringify(item), "PX", option.expiredTime.getTime() - Date.now());
        }
        else {
            batch.SET(key, JSON.stringify(cache));
        }
        if (option.tags) {
            option.tags.each(o => {
                batch.SADD("tag:" + o, key);
            });
        }
        return new Promise<void>((ok, fail) => {
            batch.EXEC((error, res) => {
                if (error) {
                    fail(error);
                    return;
                }
                ok();
            });
        });
    }
    public async remove(...keys: string[]): Promise<void> {
        const batch = this.connection.batch();
        keys.each(key => batch.DEL(key));
        return new Promise<void>((ok, fail) => {
            batch.EXEC((error, res) => {
                if (error) {
                    fail(error);
                    return;
                }
                ok();
            });
        });
    }
    public async removeTag(...tags: string[]): Promise<void> {
        const batch = this.connection.batch();
        tags.each(tag => batch.SMEMBERS("tag:" + tag));
        return new Promise<void>((ok, fail) => {
            batch.EXEC((error, res) => {
                if (error) {
                    fail(error);
                    return;
                }
                const keys = res.selectMany(o => o as any[]).distinct().toArray();
                ok(this.remove(...keys));
            });
        });
    }
    public async clear(): Promise<void> {
        this.connection.FLUSHDB();
    }
}
