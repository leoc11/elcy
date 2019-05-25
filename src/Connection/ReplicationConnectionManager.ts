import { IConnectionPoolOption } from "../Data/Interface/IConnectionOption";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";
import { PooledConnection } from "./PooledConnection";
import { PooledConnectionManager } from "./PooledConnectionManager";

export class ReplicationConnectionManager implements IConnectionManager {
    public get driver() {
        return this.masterConnectionManager.driver;
    }
    constructor(masterDriver: IDriver<any>, replicaDrivers: Array<IDriver<any>>, poolOption?: IConnectionPoolOption) {
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
    public readonly masterConnectionManager: PooledConnectionManager;
    public readonly replicaConnectionManagers: PooledConnectionManager[];
    public async getAllConnections(): Promise<IConnection[]> {
        const res: IConnection[] = [await this.masterConnectionManager.getConnection(true)];
        for (const a of this.replicaConnectionManagers) {
            res.push(await a.getConnection(false));
        }
        return res;
    }
    public async getConnection(writable?: boolean): Promise<PooledConnection> {
        const manager = writable ? this.masterConnectionManager : this.replicaConnectionManagers.orderBy([(o) => o.connectionCount]).first();
        return await manager.getConnection(writable);
    }
}
