import { IConnection } from "../../Connection/IConnection";
import * as tedious from "tedious";
import { IQueryResult } from "../../QueryBuilder/IQueryResult";
import { IEventHandler, IEventDispacher } from "../../Event/IEventHandler";
import { EventHandlerFactory } from "../../Event/EventHandlerFactory";
import { IsolationLevel } from "../../Common/Type";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";

interface ITransactionData {
    prevIsolationLevel: IsolationLevel;
    isolationLevel: IsolationLevel;
    name: string;
}
export class MssqlConnection implements IConnection {
    constructor(public connectionOption: any) {
        [this.closeEvent, this.onClosed] = EventHandlerFactory(this);
    }
    public isolationLevel: IsolationLevel = "READ COMMITTED";
    private connection: tedious.Connection;
    private transactions: ITransactionData[] = [];
    public database: string;
    protected isChangeIsolationLevel: boolean;
    public get inTransaction(): boolean {
        return this.transactions.length > 0;
    }
    public get isOpen() {
        return this.connection;
    }
    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection) {
                this.connection.once("end", () => {
                    this.connection = null;
                    resolve();
                    this.onClosed();
                });
                this.connection.close();
            }
            else {
                resolve();
            }
        });
    }
    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const con = new tedious.Connection(this.connectionOption);
            con.once("connect", (error?: any) => {
                if (error) {
                    reject(error);
                }
                this.connection = con;
                resolve();
            });
            con.once("error", (error: any) => {
                this.close();
            });
        });
    }
    public startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        return new Promise((resolve, reject) => {
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
                    this.connection.saveTransaction(cb, transactionName);
                }
                else {
                    let tediousIsolationLevel: any;
                    if (isolationLevel)
                        tediousIsolationLevel = tedious.ISOLATION_LEVEL[isolationLevel.replace(" ", "_")];

                    this.connection.beginTransaction(cb, transactionName, tediousIsolationLevel);
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
                if (this.transactions.length === 1) {
                    const transactionName = this.transactions[this.transactions.length - 1].name;
                    this.connection.commitTransaction(cb, transactionName);
                }
                else {
                    cb();
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
                this.connection.rollbackTransaction(cb, transactionName);
            }
        });
    }
    public executeQuery(command: IQueryCommand): Promise<IQueryResult[]> {
        return new Promise<IQueryResult[]>((resolve, reject) => {
            const results: IQueryResult[] = [];
            let result: IQueryResult;

            const request = new tedious.Request(command.query, (error: string, rowCount: number, rows: any[]) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
            request.on("error", function (error: any) {
                reject(new Error(error));
            });
            request.on("columnMetadata", function (columns: any) {
                result = {
                    rows: [],
                    effectedRows: 0
                };
            });
            request.on("row", (columns: any) => {
                const row: { [key: string]: any } = {};
                for (const column of columns) {
                    row[column.metadata.colName] = column.value;
                }

                (result.rows as any[]).push(row);
            });

            const doneHandler = (rowCount: number, more: boolean, asd: any) => {
                if (result) {
                    result.effectedRows = rowCount;
                    results.push(result);
                    result = null;
                }
                else {
                    results.push({ effectedRows: rowCount });
                }
            };
            request.on("doneInProc", doneHandler);
            request.on("done", doneHandler);

            if (command.parameters) {
                for (const key in command.parameters) {
                    // TODO: map parameter type.
                    const value = command.parameters[key];
                    request.addParameter(key, this.resolveDriverType(value), value);
                }
            }

            this.connection.execSql(request);
        });
    }
    public setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.execSqlBatch(new tedious.Request("SET TRANSACTION ISOLATION LEVEL " + isolationLevel, (error: string) => {
                if (error)
                    reject(error);

                this.isolationLevel = isolationLevel;
                resolve();
            }));
        });
    }
    public closeEvent: IEventHandler<MssqlConnection>;
    protected onClosed: IEventDispacher<MssqlConnection>;
    protected resolveDriverType(value: any) {
        if (value !== null && value !== undefined) {
            switch (value.constructor) {
                case Number: {
                    if (value % 1 === 0) {
                        return tedious.TYPES.Int;
                    }
                    return tedious.TYPES.Float;
                }
                case Boolean: {
                    return tedious.TYPES.Bit;
                }
                case Date: {
                    return tedious.TYPES.DateTime;
                }
                case Array: {
                    return tedious.TYPES.TVP;
                }
                case Int8Array:
                case Int16Array:
                case Int32Array:
                case Uint8Array:
                case Uint16Array:
                case Uint32Array:
                case Float32Array:
                case Float64Array: {
                    return tedious.TYPES.VarBinary;
                }
            }
        }
        return tedious.TYPES.NVarChar;
    }
}