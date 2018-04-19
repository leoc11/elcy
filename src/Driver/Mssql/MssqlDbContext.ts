import { DbContext } from "../../Data/DBContext";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { ConnectionPool, config, Request } from "mssql";
import { IMssqlConnectionOption } from "./IMssqlConnectionOption";
import { IQueryResult } from "../../QueryBuilder/QueryResult";
import { PlainObjectQueryResultParser } from "../../QueryBuilder/ResultParser/PlainObjectQueryResultParser";

export abstract class MssqlDbContext extends DbContext {
    public queryParser = PlainObjectQueryResultParser;
    public queryBuilder = MssqlQueryBuilder;
    private connectionPool: ConnectionPool;
    protected connectionOptions: IMssqlConnectionOption;
    constructor(connectionOption: IMssqlConnectionOption) {
        super(connectionOption);
    }
    protected getConnectionOptions() {
        const config: config = this.connectionOptions as any;
        config.server = this.connectionOptions.host;
        if (!config.options)
            config.options = { appName: "lc-framework" };
        else if (!config.options.appName)
            config.options.appName = "lc-framework";
        if (this.connectionOptions.poolOption) {
            config.pool = this.connectionOptions.poolOption;
            config.pool.maxWaitingClients = this.connectionOptions.poolOption.queueLimit;
            config.pool.acquireTimeoutMillis = this.connectionOptions.poolOption.acquireTimeout;
        }
        return config;
    }
    protected async getConnection(): Promise<Request> {
        if (!this.connectionPool)
            this.connectionPool = await (new ConnectionPool(this.getConnectionOptions())).connect();
        return this.connectionPool.request();
    }
    public async executeQuery(query: string, parameters?: Map<string, any>) {
        const connection = await this.getConnection();
        if (parameters) {
            for (const [key, value] of parameters) {
                connection.input(key, value);
            }
        }
        const rows = await connection.query(query);
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
