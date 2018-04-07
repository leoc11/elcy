import { DbContext } from "../../Linq/DBContext";
import { MysqlQueryBuilder } from "./MysqlQueryBuilder";
import { Pool, PoolOptions, createPool, PoolConnection } from "mysql2/promise";
import { IMysqlConnectionOption } from "./IMysqlConnectionOption";

export abstract class MysqlDbContext extends DbContext {
    public queryBuilder = MysqlQueryBuilder;
    private connectionPool: Pool;
    private _connection: PoolConnection;
    protected connectionOptions: IMysqlConnectionOption;
    protected getConnectionOptions(): PoolOptions {
        const option: PoolOptions = this.connectionOptions;
        if (this.connectionOptions.poolOption) {
            option.acquireTimeout = this.connectionOptions.poolOption.acquireTimeout;
            option.connectionLimit = this.connectionOptions.poolOption.max;
        }
        return option;
    }
    protected async getConnection() {
        if (!this.connectionPool)
            this.connectionPool = createPool(this.connectionOptions);
        if (!this._connection)
            this._connection = await this.connectionPool.getConnection();
        return this._connection;
    }
    public async executeRawQuery(query: string): Promise<any> {
        const connection = await this.getConnection();
        const [rows] = await connection.execute(query);
        return rows;
    }
}
