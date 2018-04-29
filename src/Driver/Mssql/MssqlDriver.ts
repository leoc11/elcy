import { ConnectionPool, config, Request, Transaction } from "mssql";
import { IMssqlConnectionOption } from "./IMssqlConnectionOption";
import { IQueryResult } from "../../QueryBuilder/QueryResult";
import { IDriver } from "../IDriver";

export class MssqlDriver implements IDriver {
    private transaction: Transaction;
    private _connectionPool: ConnectionPool;
    protected get connectionPool(): ConnectionPool {
        if (!this._connectionPool)
            this._connectionPool = new ConnectionPool(this.getConnectionOptions());
        return this._connectionPool;
    }
    public get database() {
        return this.connectionOptions.database;
    }
    constructor(protected connectionOptions: IMssqlConnectionOption) {
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
        if (!this.connectionPool.connected)
            await this.connectionPool.connect();

        if (this.transaction)
            return new Request(this.transaction);

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
        for (let i = 0; i < rows.rowsAffected.length; i++) {
            results.push({
                rows: rows.recordsets[i],
                effectedRows: rows.rowsAffected[i]
            });
        }
        return results;
    }
    public async startTransaction(): Promise<void> {
        if (!this.connectionPool.connected)
            await this.connectionPool.connect();
        this.transaction = new Transaction(this.connectionPool);
        await this.transaction.begin();
    }
    public async commitTransaction(): Promise<void> {
        await this.transaction.commit();
        this.transaction = null;
    }
    public async rollbackTransaction(): Promise<void> {
        await this.transaction.rollback();
        this.transaction = null;
    }
}
