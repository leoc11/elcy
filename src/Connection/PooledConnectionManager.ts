import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "../Driver/IDriver";
import { IConnectionPoolOption } from "../Data/Interface/IConnectionOption";
import { PooledConnection } from "./PooledConnection";
import { ConnectionError } from "../Error/ConnectionError";

export class PooledConnectionManager implements IConnectionManager {
    constructor(protected driver: IDriver<any>, public readonly poolOption?: IConnectionPoolOption) {
        if (!this.poolOption) this.poolOption = {};
        if (typeof this.poolOption.idleTimeout !== "number") this.poolOption.idleTimeout = 30000;
        if (typeof this.poolOption.maxConnection !== "number") this.poolOption.maxConnection = Infinity;
        if (typeof this.poolOption.max !== "number") this.poolOption.max = 10;
        if (typeof this.poolOption.min !== "number") this.poolOption.min = 0;
        if (typeof this.poolOption.acquireTimeout !== "number") this.poolOption.acquireTimeout = 60000;
        if (this.poolOption.queueType !== "lifo") this.poolOption.queueType = "fifo";
    }
    public readonly pools: PooledConnection[] = [];
    protected _waitQueues: Array<(value: PooledConnection) => void> = [];
    public connectionCount = 0;
    private _idleTimeout: any;
    public async getConnection(writable?: boolean): Promise<PooledConnection> {
        let con: PooledConnection;
        if (this.driver.allowPooling && this.pools.length >= this.poolOption.min) {
            const firstCon = this.pools[0];
            con = this.poolOption.queueType === "lifo" ? this.pools.pop() : this.pools.shift();
            if (con === firstCon) {
                this.clearIdleTimeout();
            }
        }
        else {
            if (this.connectionCount > this.poolOption.maxConnection) {
                let resolve: (value: PooledConnection) => void;
                let reject: (reason: any) => void;
                const promise = new Promise<PooledConnection>((res, rej) => {
                    resolve = res;
                    reject = rej;
                });
                if (this.poolOption.acquireTimeout !== Infinity) {
                    setTimeout(() => {
                        this._waitQueues.remove(resolve);
                        reject(new ConnectionError(10, "Maximum connection has been reached"));
                    }, this.poolOption.acquireTimeout);
                }
                this._waitQueues.push(resolve);
                return promise;
            }

            const connection = await this.driver.getConnection();
            con = new PooledConnection(connection, this);
            this.connectionCount++;
        }

        return con;
    }
    public async getAllServerConnections(): Promise<IConnection[]> {
        return [await this.driver.getConnection()];
    }
    public release(connection: PooledConnection): Promise<void> {
        if (this.driver.allowPooling && !connection.inTransaction && this.pools.length < this.poolOption.max) {
            return connection.reset().then(() => {
                const waiting = this._waitQueues.shift();
                if (waiting) {
                    waiting(connection);
                }
                else {
                    this.pools.push(connection);
                    connection.expiredTime = (new Date()).addMilliseconds(this.poolOption.idleTimeout);
                    this.setIdleTimeout(connection.expiredTime);
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

    private setIdleTimeout(expiredTime: Date) {
        if (!this._idleTimeout) {
            this._idleTimeout = setTimeout(() => {
                const con = this.pools.shift();
                this._idleTimeout = null;
                this.connectionCount--;
                con.connection.close();
                if (this.pools.length)
                    this.setIdleTimeout(this.pools[0].expiredTime);
            }, Date.now() - expiredTime.getTime());
        }
    }
    private clearIdleTimeout() {
        if (this._idleTimeout) {
            clearTimeout(this._idleTimeout);
            this._idleTimeout = null;
            if (this.pools.length > 0)
                this.setIdleTimeout(this.pools[0].expiredTime);
        }
    }
}
