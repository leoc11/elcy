import { DbType } from "../Common/StringType";
import { IPoolOption } from "../Pool/IPoolOption";
import { Pool } from "../Pool/Pool";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";
import { PooledConnection } from "./PooledConnection";

export class PooledConnectionManager<T extends DbType = any> extends Pool<PooledConnection> implements IConnectionManager<T> {
    constructor(public readonly driver: IDriver<T>, public readonly poolOption: IPoolOption = {}) {
        super(poolOption);
    }
    public async create(): Promise<PooledConnection> {
        const con = await this.driver.getConnection();
        return new PooledConnection(con);
    }
    public async getAllConnections(): Promise<IConnection[]> {
        return [await this.create()];
    }

    public getConnection(writable?: boolean): Promise<PooledConnection> {
        return this.acquireResource();
    }
}
