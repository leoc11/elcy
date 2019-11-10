import { DbType } from "../Common/StringType";
import { IPoolOption } from "../Pool/IPoolOption";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";
import { PooledConnection } from "./PooledConnection";
import { PooledConnectionManager } from "./PooledConnectionManager";

export class ReplicationConnectionManager<T extends DbType = any> implements IConnectionManager<T> {
    public get driver() {
        return this.masterConnectionManager.driver;
    }
    constructor(masterDriver: IDriver<T>, replicaDrivers: Array<IDriver<T>>, poolOption?: IPoolOption) {
        this.masterConnectionManager = new PooledConnectionManager(masterDriver, poolOption);
        if (replicaDrivers.length <= 0) {
            replicaDrivers.push(masterDriver);
        }

        this.replicaConnectionManagers = replicaDrivers.select((o) => o === masterDriver ? this.masterConnectionManager : new PooledConnectionManager(o, poolOption)).toArray();
        this.nextReplicaManager = this.replicaConnectionManagers[0];
    }
    public readonly masterConnectionManager: PooledConnectionManager<T>;
    public readonly replicaConnectionManagers: Array<PooledConnectionManager<T>>;
    private counter = 0;
    private nextReplicaManager: PooledConnectionManager<T>;
    public getAllConnections(): Promise<IConnection[]> {
        const resPromises: Array<Promise<IConnection>> = [];
        resPromises.push(this.masterConnectionManager.getConnection(true));
        for (const a of this.replicaConnectionManagers) {
            resPromises.push(a.getConnection(false));
        }
        return Promise.all(resPromises);
    }
    public async getConnection(writable?: boolean): Promise<PooledConnection> {
        if (writable) {
            return this.masterConnectionManager.getConnection(true);
        }

        this.counter = ((this.counter + 1) % this.replicaConnectionManagers.length) - 1;
        const manager = this.nextReplicaManager;
        this.nextReplicaManager = this.replicaConnectionManagers[this.counter];
        const connection = await manager.getConnection();
        connection.releaseEvent.add(() => {
            if (this.nextReplicaManager.waitCount > manager.waitCount) {
                this.nextReplicaManager = manager;
            }
        });
        return connection;
    }
}
