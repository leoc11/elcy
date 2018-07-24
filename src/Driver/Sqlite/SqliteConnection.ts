import { IConnection } from "../../Connection/IConnection";
import { IQueryResult } from "../../QueryBuilder/QueryResult";
import { IEventHandler, IEventDispacher } from "../../Event/IEventHandler";
import { EventHandlerFactory } from "../../Event/EventHandlerFactory";
import { IsolationLevel, QueryType } from "../../Common/Type";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";
import * as sqlite3 from "sqlite3";
import { ISqliteConnectionOption } from "./ISqliteConnectionOption";

interface ITransactionData {
    prevIsolationLevel: IsolationLevel;
    isolationLevel: IsolationLevel;
    name: string;
}
export class SqliteConnection implements IConnection {
    constructor(public connectionOption: ISqliteConnectionOption) {
        [this.closeEvent, this.onClosed] = EventHandlerFactory(this);
    }
    public isolationLevel: IsolationLevel = "READ COMMITTED";
    private connection: sqlite3.Database;
    private transactions: ITransactionData[] = [];
    public database: string;
    protected isChangeIsolationLevel: boolean;
    public get inTransaction(): boolean {
        return this.transactions.length > 0;
    }
    public get isOpen() {
        return !!this.connection;
    }
    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const con = new sqlite3.Database(this.connectionOption.database, this.connectionMode, (error: Error) => {
                reject(error);
            });
            con.once("open", () => {
                this.connection = con;
                resolve();
            });
        });
    }
    protected get connectionMode() {
        if (this.connectionOption.mode)
            return sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

        return sqlite3[this.connectionOption.mode];
    }
    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.once("close", () => {
                this.connection = null;
                resolve();
                this.onClosed();
            });
            this.connection.close((error: Error) => {
                if (error)
                    reject(error);
            });
        });
    }
    public startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (this.isOpen) {
                const transactionName = "transaction_" + this.transactions.length;
                const useSavePoint = this.inTransaction;
                const curIsolationLevel = this.isolationLevel;
                const cb = async (error?: any) => {
                    if (error)
                        return reject(error);

                    if (isolationLevel) {
                        if (useSavePoint) {
                            if (isolationLevel !== curIsolationLevel) {
                                await this.setIsolationLevel(isolationLevel);
                            }
                        }
                        else {
                            this.isolationLevel = isolationLevel;
                        }
                    }

                    this.transactions.push({
                        name: transactionName,
                        isolationLevel: isolationLevel,
                        prevIsolationLevel: curIsolationLevel
                    });

                    resolve();
                };
                if (useSavePoint) {
                    this.connection.run(`SAVEPOINT ${transactionName}`, cb);
                }
                else {
                    if (isolationLevel) {
                        await this.setIsolationLevel(isolationLevel);
                    }
                    this.connection.run("BEGIN TRANSACTION", cb);
                }
            }
        });
    }
    public commitTransaction(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isOpen && this.inTransaction) {
                const cb = async (error?: Error) => {
                    if (error)
                        return reject(error);

                    const transaction = this.transactions.pop();
                    if (transaction.prevIsolationLevel && transaction.prevIsolationLevel !== this.isolationLevel) {
                        await this.setIsolationLevel(transaction.prevIsolationLevel);
                    }
                    resolve();
                };
                const transactionName = this.transactions[this.transactions.length - 1].name;
                if (this.transactions.length === 1) {
                    this.connection.run("COMMIT TRANSACTION", cb);
                }
                else {
                    this.connection.run(`RELEASE SAVEPOINT ${transactionName}`, cb);
                }
            }
        });
    }
    public rollbackTransaction(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isOpen && this.inTransaction) {
                const cb = async (error?: Error) => {
                    if (error)
                        return reject(error);

                    const transaction = this.transactions.pop();
                    if (transaction.prevIsolationLevel && transaction.prevIsolationLevel !== this.isolationLevel) {
                        await this.setIsolationLevel(transaction.prevIsolationLevel);
                    }
                    resolve();
                };
                const transactionName = this.transactions[this.transactions.length - 1].name;
                if (this.transactions.length === 1) {
                    this.connection.run("ROLLBACK TRANSACTION", cb);
                }
                else {
                    this.connection.run(`ROLLBACK TO SAVEPOINT ${transactionName}`, cb);
                }
            }
        });
    }
    public executeQuery(command: IQueryCommand): Promise<IQueryResult[]> {
        return new Promise<IQueryResult[]>((resolve, reject) => {
            const results: IQueryResult[] = [];
            const params = this.getParameter(command.parameters);
            if (command.type & QueryType.DQL) {
                this.connection.all(command.query, params, function (this: sqlite3.Statement, error: Error, rows: any[]) {
                    if (error) {
                        reject(error);
                        return;
                    }

                    results.push({
                        effectedRows: rows.length,
                        rows: rows
                    });
                    resolve(results);
                });
            }
            else {
                this.connection.run(command.query, params, function (this: sqlite3.RunResult, error: Error) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    else {
                        results.push({
                            effectedRows: this.changes
                        });
                        resolve(results);
                    }
                });
            }
        });
    }
    public setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        return new Promise((resolve, reject) => {
            const cb = (result: sqlite3.RunResult, error: Error) => {
                if (error)
                    reject(error);

                this.isolationLevel = isolationLevel;
                resolve();
            };
            if (isolationLevel === "READ UNCOMMITTED") {
                // set pragma
                this.connection.run("PRAGMA read_uncommitted = true", cb);
            }
            else {
                // remove pragma
                this.connection.run("PRAGMA read_uncommitted = false", cb);
            }
        });
    }
    public closeEvent: IEventHandler<SqliteConnection>;
    protected onClosed: IEventDispacher<SqliteConnection>;
    protected getParameter(param: { [key: string]: string }) {
        const result: { [key: string]: string } = {};
        if (param) {
            for (const prop in param) {
                result["@" + prop] = param[prop];
            }
        }
        return result;
    }
}