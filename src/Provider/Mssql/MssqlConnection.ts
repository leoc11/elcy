import { IConnection } from "../../Connection/IConnection";
import { IQueryResult } from "../../Query/IQueryResult";
import { IEventHandler, IEventDispacher } from "../../Event/IEventHandler";
import { EventHandlerFactory } from "../../Event/EventHandlerFactory";
import { IsolationLevel } from "../../Common/Type";
import { IQuery } from "../../Query/IQuery";
import { ConnectionError } from "../../Error/ConnectionError";
import { Uuid } from "../../Data/Uuid";
import { TimeSpan } from "../../Data/TimeSpan";
import { QueryBuilderError, QueryBuilderErrorCode } from "../../Error/QueryBuilderError";

interface ITransactionData {
    prevIsolationLevel: IsolationLevel;
    isolationLevel: IsolationLevel;
    name: string;
}
interface IDriverParameter {
    type: string;
    value: any;
}
let tedious: any;
export class MssqlConnection implements IConnection {
    constructor(public connectionOption: any) {
        [this.errorEvent, this.onError] = EventHandlerFactory(this);
    }
    public isolationLevel: IsolationLevel = "READ COMMITTED";
    private connection: any;
    private transactions: ITransactionData[] = [];
    public get database(): string {
        return this.connectionOption.database;
    }
    protected isChangeIsolationLevel: boolean;
    public get inTransaction(): boolean {
        return this.transactions.length > 0;
    }
    public get isOpen() {
        return !!this.connection;
    }
    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection) {
                this.connection.once("end", () => {
                    this.connection = null;
                    resolve();
                });
                this.connection.close();
            }
            else {
                resolve();
            }
        });
    }
    public reset(): Promise<void> {
        if (this.connection) {
            return new Promise<void>((resolve, reject) => {
                this.connection.reset((err: any) => {
                    if (err)
                        reject(err);
                    resolve();
                });
            });
        }
        return Promise.resolve();
    }
    public open(): Promise<void> {
        if (this.isOpen) return Promise.resolve();

        return new Promise<void>(async (resolve, reject) => {
            if (!tedious) {
                tedious = await import("tedious" as any);
            }

            const con = new tedious.Connection(this.connectionOption);
            con.once("connect", (error?: any) => {
                if (error) {
                    reject(error);
                }
                this.connection = con;
                resolve();
            });
            con.once("error", (error: Error) => {
                this.onError(new ConnectionError(10, error));
                this.close();
            });
        });
    }
    public startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        if (!this.isOpen) Promise.reject(new Error("Connection not open"));
        return new Promise((resolve, reject) => {
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
    public executeQuery(command: IQuery): Promise<IQueryResult[]> {
        return new Promise<IQueryResult[]>((resolve, reject) => {
            const results: IQueryResult[] = [];
            let result: IQueryResult = {
                effectedRows: 0
            };
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

            const doneHandler = (rowCount: number, more: boolean) => {
                if (rowCount) result.effectedRows = rowCount;
                results.push(result);
                result = {
                    effectedRows: 0
                };
            };
            request.on("doneInProc", doneHandler);
            request.on("done", doneHandler);

            if (command.parameters) {
                for (const [key, value] of command.parameters) {
                    // TODO: map parameter type.
                    const param = this.resolveParameter(value);
                    request.addParameter(key, param.type, param.value);
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
    public errorEvent: IEventHandler<MssqlConnection, Error>;
    protected onError: IEventDispacher<Error>;
    protected resolveParameter(input: any): IDriverParameter {
        let value = input;
        let driverType: any;
        if (input !== null && input !== undefined) {
            switch (input.constructor) {
                case Number: {
                    driverType = input % 1 === 0 ? tedious.TYPES.Int : tedious.TYPES.Float;
                    break;
                }
                case Boolean: {
                    driverType = tedious.TYPES.Bit;
                    break;
                }
                case Date: {
                    driverType = tedious.TYPES.DateTime;
                    break;
                }
                case Uuid: {
                    value = (input as Uuid).toString();
                    // driverType = tedious.TYPES.UniqueIdentifier;
                    break;
                }
                case TimeSpan: {
                    driverType = tedious.TYPES.Time;
                    break;
                }
                case ArrayBuffer:
                case DataView:
                case Int8Array:
                case Int16Array:
                case Int32Array:
                case Uint8Array:
                case Uint16Array:
                case Uint32Array:
                case Float32Array:
                case Float64Array: {
                    driverType = tedious.TYPES.VarBinary;
                    value = new Buffer(value.buffer ? value.buffer : value);
                    break;
                }
                case Array: {
                    throw new QueryBuilderError(QueryBuilderErrorCode.NotSupported, "TVP not supported by driver");
                }
            }
        }
        if (!driverType) driverType = tedious.TYPES.NVarChar;
        return {
            value: value,
            type: driverType
        };
    }
}