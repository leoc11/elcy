import { DbType } from "../Common/StringType";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";
import { PooledConnection } from "./PooledConnection";
import { Pool } from "../Pool/Pool";
import { IPoolOption } from "../Pool/IPoolOption";

export class PooledConnectionManager<T extends DbType = any> extends Pool<PooledConnection> implements IConnectionManager<T> {
    public async create(): Promise<PooledConnection> {
        const con = await this.driver.getConnection();
        return new PooledConnection(con);
    }
    constructor(public readonly driver: IDriver<T>, public readonly poolOption: IPoolOption = {}) {
        super(poolOption);
    }
    public async getAllConnections(): Promise<IConnection[]> {
        return [await this.create()];
    }

    public getConnection(writable?: boolean): Promise<PooledConnection> {
        return this.acquireResource();
    }
}
