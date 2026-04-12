import type { IConnection } from "@elcy/core/src/Connection/IConnection";
import type { IQueryResult } from "@elcy/core/src/Query/IQueryResult";
import type { IEventHandler, IEventDispacher } from "@elcy/core/src/Event/IEventHandler";
import { EventHandlerFactory } from "@elcy/core/src/Event/EventHandlerFactory";
import type { IsolationLevel } from "@elcy/core/src/Common/StringType";
import { QueryType } from "@elcy/core/src/Common/Enum";
import type { IQuery } from "@elcy/core/src/Query/IQuery";
import { BatchedQuery } from "@elcy/core/src/Query/BatchedQuery";
import { isNull } from "@elcy/core/src/Helper/Util";
import { SQL } from "bun";

interface IBunTransaction {
    connection: Bun.TransactionSQL | Bun.SavepointSQL;
    resolver: () => void;
    rejector: (reason: any) => void;
    name: string;
}

interface SQLResultArray<T = any> extends Array<T> {
    count?: number;
    command?: string;
    lastInsertRowid?: any;
    affectedRows?: number;
}

export class BunPosgresqlConnection implements IConnection {
    constructor(public readonly client: SQL) {
        this.database = client.options?.database ?? "unknown";
        [this.errorEvent, this.onError] = EventHandlerFactory(this);
    }
    public database: string;
    public isolationLevel: IsolationLevel = "READ COMMITTED";
    private get transaction() {
        return this.transactions?.[0]?.connection as Bun.TransactionSQL;
    }
    private get connection() {
        return this.transactions?.[this.transactions.length - 1]?.connection ?? this.client;
    }
    private transactions: IBunTransaction[] = [];
    public get inTransaction(): boolean {
        return !!this.transaction;
    }
    public get isOpen() {
        return true;
    }
    public async open(): Promise<void> { }
    public async close(): Promise<void> { }
    public async reset(): Promise<void> { }
    public async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        if (!this.isOpen) {
            return;
        }

        const transactionName = "transaction_" + this.transactions.length;
        const useSavePoint = this.inTransaction;

        if (useSavePoint && isolationLevel && isolationLevel !== this.isolationLevel) {
            throw new Error("cannot change isolation level on savepoint");
        }

        if (this.transaction) {
            this.transaction.savepoint(transactionName, tx => {
                return new Promise<void>((resolver, rejector) => {
                    this.transactions.push({
                        name: transactionName,
                        connection: tx,
                        rejector: rejector,
                        resolver: resolver
                    })
                });
            });
            this.transaction`SAVEPOINT ${transactionName};`;
        }
        else {
            await new Promise<void>((ok) => {
                this.client.transaction(async (tx) => {
                    if (isolationLevel) {
                        await tx`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`;
                        this.isolationLevel = isolationLevel;
                    }

                    try {
                        await new Promise<void>((resolver, rejector) => {
                            this.transactions.push({
                                name: transactionName,
                                connection: tx,
                                rejector: rejector,
                                resolver: resolver
                            });
                            ok();
                        });
                    }
                    catch (e) {
                        throw e;
                    }
                });
            });
        }
    }
    public async commitTransaction(): Promise<void> {
        if (!this.isOpen || !this.inTransaction) {
            return;
        }

        const lastTransaction = this.transactions[this.transactions.length - 1];
        if (this.transactions.length === 1) {
            lastTransaction?.resolver();
            await new Promise<void>((res) => setTimeout(res));
        }
        else {
            this.connection`RELEASE SAVEPOINT ${lastTransaction?.name};`;
        }
        this.transactions.pop();
    }
    public async rollbackTransaction(): Promise<void> {
        const lastTransaction = this.transactions[this.transactions.length - 1];
        if (this.transactions.length === 1) {
            lastTransaction?.rejector("rollback");
        }
        else {
            this.connection`ROLLBACK TO SAVEPOINT ${lastTransaction?.name};`;
        }
        this.transactions.pop();
    }
    public async query(command: IQuery): Promise<IQueryResult[]>;
    public async query(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    public async query(query: string, type?: QueryType, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    public async query(commandOrQuery: IQuery | string, parametersOrType?: Map<string, any> | QueryType, parameters?: Map<string, any>): Promise<IQueryResult[]> {
        if (!this.isOpen) return Promise.reject(new Error("Connection not open"));
        let command: IQuery;
        if (typeof commandOrQuery === "string") {
            let type: QueryType;
            if (parametersOrType instanceof Map) {
                parameters = parametersOrType;
                type = QueryType.DQL;
            }
            else {
                type = parametersOrType!;
            }
            command = {
                query: commandOrQuery,
                parameters: parameters,
                type: type
            };
        }
        else {
            command = commandOrQuery;
        }

        const commands = command instanceof BatchedQuery ? Array.from(command.queries) : [command];
        // use pipeline to reduce roundtrip
        return await Promise.all(commands.map(o => this.connection.unsafe(o.query, this.getParameter(o.parameters))
            .then((execResult: SQLResultArray) => {
                const queryResult: IQueryResult = {};
                if (execResult.length || isNull(execResult.count)) {
                    queryResult.effectedRows = execResult.length;
                    queryResult.rows = execResult;
                }
                else {
                    queryResult.effectedRows = execResult.count;
                }
                return queryResult;
            })));
    }
    public async setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        await this.connection`SET TRANSACTION ISOLATION LEVEL ${isolationLevel};`;
    }
    public errorEvent: IEventHandler<BunPosgresqlConnection, Error>;
    protected onError: IEventDispacher<Error>;
    protected getParameter(param?: Map<string, any>) {
        return param?.size ? Array.from(param.values()) : [];
    }
}