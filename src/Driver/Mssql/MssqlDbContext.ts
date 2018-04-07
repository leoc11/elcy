import { DbContext } from "../../Linq/DBContext";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { ConnectionPool, config } from "mssql";
import { IMssqlConnectionOption } from "./IMssqlConnectionOption";
import { ArrayQueryResultParser } from "../../QueryBuilder/ResultParser/ArrayQueryResultParser";
import { IQueryResult } from "../../QueryBuilder/QueryResult";

export abstract class MssqlDbContext extends DbContext {
    public queryParser = ArrayQueryResultParser;
    public queryBuilder = MssqlQueryBuilder;
    private connectionPool: ConnectionPool;
    private _connection: ConnectionPool;
    protected connectionOptions: IMssqlConnectionOption;
    constructor(connectionOption: IMssqlConnectionOption) {
        super(connectionOption);
    }
    protected getConnectionOptions() {
        const config: config = this.connectionOptions as any;
        config.server = this.connectionOptions.host;
        if (this.connectionOptions.poolOption) {
            config.pool = this.connectionOptions.poolOption;
            config.pool.maxWaitingClients = this.connectionOptions.poolOption.queueLimit;
            config.pool.acquireTimeoutMillis = this.connectionOptions.poolOption.acquireTimeout;
        }
        return config;
    }
    protected async getConnection() {
        if (!this.connectionPool)
            this.connectionPool = new ConnectionPool(this.getConnectionOptions());
        if (!this._connection)
            this._connection = await this.connectionPool.connect();
        return this._connection;
    }
    public async executeRawQuery(query: string) {
        const connection = await this.getConnection();
        const rows = await connection.request().query(query);
        const results: IQueryResult[] = [];
        for (let i = 0; i < rows.recordsets.length; i++) {
            results.push({
                rows: rows.recordsets[i],
                effectedRows: rows.rowsAffected[i]
            });
        }
        return results;
    }
}
