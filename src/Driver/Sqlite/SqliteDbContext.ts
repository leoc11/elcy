import { DbContext } from "../../Data/DBContext";
import { sqlite3, Database } from "sqlite3";
export abstract class SqliteDbContext extends DbContext {
    private _connection: Database;
    protected getConnectionOptions(): PoolOptions {
        const option: PoolOptions = this.connectionOptions;
        if (this.connectionOptions.poolOption) {
            option.acquireTimeout = this.connectionOptions.poolOption.acquireTimeout;
            option.connectionLimit = this.connectionOptions.poolOption.max;
        }
        return option;
    }
    protected async getConnection() {
        if (!this._connection)
            this._connection = new Database("");
        return this._connection;
    }
    public async executeQuery(query: string): Promise<any> {
        const connection = await this.getConnection();
        const [rows] = await connection.exec(query);
        return rows;
    }
}
