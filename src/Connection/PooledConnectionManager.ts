import { QueuedTimeout } from "../Common/QueuedTimeout";
import { DbType } from "../Common/Type";
import { IConnectionPoolOption } from "../Data/Interface/IConnectionOption";
import { ConnectionError } from "../Error/ConnectionError";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";
import { PooledConnection } from "./PooledConnection";

interface IResolver<T> {
    reject: (reason: any) => void;
    resolve: (item: T) => void;
}
export class PooledConnectionManager<T extends DbType = any> implements IConnectionManager<T> {
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
    public readonly pools = new QueuedTimeout<PooledConnection>((con: PooledConnection) => {
        this.connectionCount--;
        con.connection.close();
    });
    public readonly waitingQueue = new QueuedTimeout<IResolver<PooledConnection>>((resolver) => {
        resolver.reject(new ConnectionError(10, "Acquire Timeout"));
    });
    protected _waitQueues: Array<(value: PooledConnection) => void> = [];
    public async getAllConnections(): Promise<IConnection[]> {
        return [await this.driver.getConnection()];
    }

    public async getConnection(writable?: boolean): Promise<PooledConnection> {
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
                this.waitingQueue.setTimeout(resolver, this.poolOption.acquireTimeout !== Infinity ? new Date().addMilliseconds(this.poolOption.acquireTimeout) : undefined);
                return promise;
            }

            const connection = await this.driver.getConnection();
            con = new PooledConnection(connection, this);
            this.connectionCount++;
        }

        return con;
    }
    public release(connection: PooledConnection): Promise<void> {
        if (this.driver.allowPooling && !connection.inTransaction) {
            return connection.reset().then(() => {
                const waiting = this.waitingQueue.shift();
                if (waiting) {
                    waiting.resolve(connection);
                }
                else {
                    this.pools.setTimeout(connection, (new Date()).addMilliseconds(this.poolOption.idleTimeout));
                    if (this.pools.queue.length > this.poolOption.max) {
                        this.pools.forceExecute(this.pools.queue.length - this.poolOption.max);
                    }
                }
            }, () => {
                this.connectionCount--;
            });
        }
        else {
            this.connectionCount--;
            return connection.connection.close();
        }
    }
    public reset(): void {
        this.pools.reset();
        this.waitingQueue.reset();
    }
}
