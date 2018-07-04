import { IConnection } from "../../Connection/IConnection";
import * as tedious from "tedious";
import { IConnectionOption } from "../../Data/Interface/IConnectionOption";
import { IQueryResult } from "../../QueryBuilder/QueryResult";
import { IEventHandler, IEventDispacher } from "../../Event/IEventHandler";
import { EventHandlerFactory } from "../../Event/EventHandlerFactory";
import { IsolationLevel } from "../../Common/Type";

export class SqlServerConnection implements IConnection {
    constructor(public connectionOption: IConnectionOption) {
        [this.closeEvent, this.onClosed] = EventHandlerFactory(this);
    }
    private connection: tedious.Connection;
    private transactionDepth: number = 0;
    public database: string;
    public get inTransaction(): boolean {
        return this.transactionDepth <= 0;
    }
    public get isOpen() {
        return this.connection;
    }
    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.once("end", () => {
                this.connection = null;
                resolve();
                this.onClosed();
            });
            this.connection.close();
        });
    }
    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const con = new tedious.Connection(this.connectionOption);
            con.once("connect", (error) => {
                if (error) {
                    reject(error);
                }
                this.connection = con;
                resolve();
            });
            con.once("error", () => {
                this.close();
            });
        });
    }
    protected getTransactionName() {
        return "transaction" + this.transactionDepth;
    }
    public startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isOpen) {
                const cb = (error) => {
                    if (error)
                        return reject(error);

                    this.transactionDepth++;
                    resolve();
                };
                const transactionName = "transaction_" + this.transactionDepth;
                if (this.inTransaction) {
                    this.connection.saveTransaction(cb, transactionName);
                }
                else {
                    this.connection.beginTransaction(cb, transactionName, isolationLevel);
                }
            }
        });
    }
    public commitTransaction(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isOpen && this.inTransaction) {
                if (this.transactionDepth === 1) {
                    const cb = (error) => {
                        if (error)
                            return reject(error);

                        this.transactionDepth--;
                        resolve();
                    };
                    const transactionName = "transaction_" + (this.transactionDepth - 1);
                    this.connection.commitTransaction(cb, transactionName);
                }
                else {
                    this.transactionDepth--;
                }
            }
        });
    }
    public rollbackTransaction(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isOpen && this.inTransaction) {
                const cb = (error) => {
                    if (error)
                        return reject(error);

                    this.transactionDepth--;
                    resolve();
                };
                const transactionName = "transaction_" + (this.transactionDepth - 1);
                this.connection.rollbackTransaction(cb, transactionName);
            }
        });
    }
    public executeQuery(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]> {
        return new Promise<IQueryResult[]>((resolve, reject) => {
            const results: IQueryResult[] = [];
            let result: IQueryResult = {
                rows: [],
                effectedRows: 0
            };

            const request = new tedious.Request(query, (error, rowCount, rows) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });

            request.on("row", (columns: any) => {
                if (!result) {
                    result = {
                        rows: [],
                        effectedRows: 0
                    };
                }

                const row: { [key: string]: any } = {};
                for (const column of columns) {
                    row[column.metadata.colName] = column.value;
                }

                result.rows.push(row);
                result.effectedRows++;
            });

            const doneHandler = (rowCount: number, more: boolean) => {
                results.push(result);
                result = null;
            };
            request.on("doneInProc", doneHandler);
            request.on("done", doneHandler);

            if (parameters) {
                for (const [key, value] of parameters) {
                    // todo: map parameter type.
                    request.addParameter(key, tedious.TYPES.NVarChar, value);
                }
            }

            this.connection.execSql(request);
        });
    }
    public closeEvent: IEventHandler<SqlServerConnection>;
    protected onClosed: IEventDispacher<SqlServerConnection>;
}