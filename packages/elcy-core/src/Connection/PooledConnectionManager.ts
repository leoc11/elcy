import { QueuedTimeout } from "../Common/QueuedTimeout";
import { DbType } from "../Common/StringType";
import { IConnectionPoolOption } from "../Data/Interface/IConnectionOption";
import { ConnectionError } from "../Error/ConnectionError";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";
import { PooledConnection } from "./PooledConnection";
import { DbFunction } from "src/Query/DbFunction";

interface IResolver<T> {
    reject: (reason: unknown) => void;
    resolve: (item: T) => void;
}
export class PooledConnectionManager<T extends DbType = DbType> implements IConnectionManager<T> {
    public get poolSize() {
        return this.pools.queue.length;
    }
    constructor(public readonly driver: IDriver<T>, public readonly poolOption?: IConnectionPoolOption) {
        if (!this.poolOption) {
            this.poolOption = {};
        }
        if (typeof this.poolOption.idleTimeout !== "number") {
            this.poolOption.idleTimeout = 30000;
        }
        if (typeof this.poolOption.maxConnection !== "number") {
            this.poolOption.maxConnection = Infinity;
        }
        if (typeof this.poolOption.max !== "number") {
            this.poolOption.max = 10;
        }
        if (typeof this.poolOption.min !== "number") {
            this.poolOption.min = 0;
        }
        if (typeof this.poolOption.acquireTimeout !== "number") {
            this.poolOption.acquireTimeout = 60000;
        }
        if (this.poolOption.queueType !== "lifo") {
            this.poolOption.queueType = "fifo";
        }
    }
    public connectionCount = 0;
    public readonly pools = new QueuedTimeout<PooledConnection>(async (con: PooledConnection) => {
        this.connectionCount--;
        await con.connection.close();
    });
    public readonly waitingQueue = new QueuedTimeout<IResolver<PooledConnection>>((resolver) => {
        resolver.reject(new ConnectionError(10, "Acquire Timeout"));
        return Promise.resolve();
    });
    public async getAllConnections(): Promise<IConnection[]> {
        return [await this.driver.getConnection()];
    }

    public async getConnection(): Promise<PooledConnection> {
        let con: PooledConnection;
        if (this.driver.allowPooling && this.pools.queue.length > this.poolOption.min) {
            con = this.poolOption.queueType === "lifo" ? this.pools.pop() : this.pools.shift();
        }
        else {
            if (this.connectionCount >= this.poolOption.maxConnection) {
                const resolver: IResolver<PooledConnection> = {} as IResolver<PooledConnection>;
                const promise = new Promise<PooledConnection>((ok, fail) => {
                    resolver.resolve = ok;
                    resolver.reject = fail;
                });
                this.waitingQueue.setTimeout(resolver, this.poolOption.acquireTimeout !== Infinity ? DbFunction.dateAdd(new Date(), { milliseconds: this.poolOption.acquireTimeout }) : undefined);
                return promise;
            }

            const connection = await this.driver.getConnection();
            con = new PooledConnection(connection, this);
            this.connectionCount++;
        }

        return con;
    }
    public async release(connection: PooledConnection): Promise<void> {
        if (this.driver.allowPooling && !connection.inTransaction) {
            try {
                await connection.reset();
                const waiting = this.waitingQueue.shift();
                if (waiting) {
                    waiting.resolve(connection);
                }
                else {
                    this.pools.setTimeout(connection, DbFunction.dateAdd(new Date(), { milliseconds: this.poolOption.idleTimeout }));
                    if (this.pools.queue.length > this.poolOption.max) {
                        await this.pools.forceExecute(this.pools.queue.length - this.poolOption.max);
                    }
                }
            }
            catch {
                this.connectionCount--;
            }
        }
        else {
            this.connectionCount--;
            return connection.connection.close();
        }
    }
    public async reset(): Promise<void> {
        await this.pools.reset();
        await this.waitingQueue.reset();
    }
}
