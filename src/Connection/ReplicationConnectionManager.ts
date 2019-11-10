import { DbType } from "../Common/StringType";
import { IConnectionPoolOption } from "../Data/Interface/IConnectionOption";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";
import { PooledConnection } from "./PooledConnection";
import { PooledConnectionManager } from "./PooledConnectionManager";

export class ReplicationConnectionManager<T extends DbType = any> implements IConnectionManager<T> {
    public get driver() {
        return this.masterConnectionManager.driver;
    }
    constructor(masterDriver: IDriver<T>, replicaDrivers: Array<IDriver<T>>, poolOption?: IConnectionPoolOption) {
        if (!poolOption) {
            poolOption = {};
        }
        if (typeof poolOption.idleTimeout !== "number") {
            poolOption.idleTimeout = 30000;
        }
        if (typeof poolOption.maxConnection !== "number") {
            poolOption.maxConnection = Infinity;
        }
        if (typeof poolOption.max !== "number") {
            poolOption.max = 10;
        }
        if (typeof poolOption.min !== "number") {
            poolOption.min = 0;
        }
        if (poolOption.queueType !== "lifo") {
            poolOption.queueType = "fifo";
        }

        this.masterConnectionManager = new PooledConnectionManager(masterDriver);
        if (replicaDrivers.length <= 0) {
            replicaDrivers.push(masterDriver);
        }

        this.replicaConnectionManagers = replicaDrivers.select((o) => o === masterDriver ? this.masterConnectionManager : new PooledConnectionManager(o)).toArray();
    }
    public readonly masterConnectionManager: PooledConnectionManager<T>;
    public readonly replicaConnectionManagers: Array<PooledConnectionManager<T>>;
    public getAllConnections(): Promise<IConnection[]> {
        const resPromises: Promise<IConnection>[] = [];
        resPromises.push(this.masterConnectionManager.getConnection(true));
        for (const a of this.replicaConnectionManagers) {
            resPromises.push(a.getConnection(false));
        }
        return Promise.all(resPromises);
    }
    private counter = 0;
    public async getConnection(writable?: boolean): Promise<PooledConnection> {
        const manager = writable ? this.masterConnectionManager : this.replicaConnectionManagers[this.counter = ((this.counter + 1) % this.replicaConnectionManagers.length) - 1];
        return await manager.getConnection(writable);
    }
}
