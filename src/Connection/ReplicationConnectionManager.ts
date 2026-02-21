import { DbType } from "../Common/StringType";
import { IConnectionPoolOption } from "../Data/Interface/IConnectionOption";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";
import { PooledConnection } from "./PooledConnection";
import { PooledConnectionManager } from "./PooledConnectionManager";
import { Enumerable } from "@elcy/enumerable";

export class ReplicationConnectionManager<T extends DbType = DbType> implements IConnectionManager<T> {
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

        this.replicaConnectionManagers = replicaDrivers.map((o) => o === masterDriver ? this.masterConnectionManager : new PooledConnectionManager(o));
    }
    public readonly masterConnectionManager: PooledConnectionManager<T>;
    public readonly replicaConnectionManagers: Array<PooledConnectionManager<T>>;
    public async getAllConnections(): Promise<IConnection[]> {
        const res: IConnection[] = [await this.masterConnectionManager.getConnection()];
        for (const a of this.replicaConnectionManagers) {
            res.push(await a.getConnection());
        }
        return res;
    }
    public async getConnection(writable?: boolean): Promise<PooledConnection> {
        const manager = writable ? this.masterConnectionManager : Enumerable.from(this.replicaConnectionManagers).orderBy([(o) => o.connectionCount]).find();
        return await manager.getConnection();
    }
}
