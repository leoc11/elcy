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
        if (typeof this.poolOption.max !== "number") this.poolOption.max = Infinity;
        if (typeof this.poolOption.maxQueue !== "number") this.poolOption.maxQueue = 10;
        if (typeof this.poolOption.minQueue !== "number") this.poolOption.minQueue = 0;
        if (this.poolOption.queueType !== "lifo") this.poolOption.queueType = "fifo";
    }
    public readonly pools: PooledConnection[] = [];
    public connectionCount = 0;
    public async getConnection(writable?: boolean): Promise<PooledConnection> {
        let con: PooledConnection;
        if (this.driver.allowPooling && this.pools.length >= this.poolOption.minQueue) {
            con = this.poolOption.queueType === "lifo" ? this.pools.pop() : this.pools.shift();
            if ((con as PooledConnection).idleTimeOut) {
                clearTimeout((con as PooledConnection).idleTimeOut);
                (con as PooledConnection).idleTimeOut = null;
            }
        }
        else {
            if (this.connectionCount > this.poolOption.max) {
                throw new ConnectionError(10, "Maximum connection has been reached");
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
        if (this.driver.allowPooling && !connection.inTransaction && this.pools.length < this.poolOption.maxQueue) {
            return connection.reset().then(() => {
                this.pools.push(connection);
                connection.idleTimeOut = setTimeout(async () => {
                    this.connectionCount--;
                    this.pools.remove(connection);
                    await connection.connection.close();
                }, this.poolOption.idleTimeout);
            }, () => {
                this.connectionCount--;
            });
        }
        else {
            this.connectionCount--;
            return connection.connection.close();
        }
    }
}
