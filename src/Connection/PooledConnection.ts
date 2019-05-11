import { IConnection } from "./IConnection";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";
import { IsolationLevel, QueryType } from "../Common/Type";
import { PooledConnectionManager } from "./PooledConnectionManager";

export class PooledConnection implements IConnection {
    constructor(public connection: IConnection, private manager: PooledConnectionManager) { }
    public get isolationLevel() { return this.connection.isolationLevel; }
    public set isolationLevel(value) { this.connection.isolationLevel = value; }
    public get database() { return this.connection.database; }
    public set database(value) { this.connection.database = value; }
    public get inTransaction() { return this.connection.inTransaction; }
    public set inTransaction(value) { this.connection.inTransaction = value; }
    public get isOpen() { return this.connection.isOpen; }
    public set isOpen(value) { this.connection.isOpen = value; }
    public close(): Promise<void> {
        return this.manager.release(this);
    }
    public reset(): Promise<void> {
        return this.connection.reset();
    }
    public open(): Promise<void> {
        return this.connection.open();
    }
    public startTransaction(): Promise<void> {
        return this.connection.startTransaction();
    }
    public commitTransaction(): Promise<void> {
        return this.connection.commitTransaction();
    }
    public rollbackTransaction(): Promise<void> {
        return this.connection.rollbackTransaction();
    }
    public query(command: IQuery): Promise<IQueryResult[]>;
    public query(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    public query(query: string, type?: QueryType, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    public query(queryOrCommand: string | IQuery, parametersOrType?: Map<string, any> | QueryType, typeOrParameters?: QueryType | Map<string, any>): Promise<IQueryResult[]> {
        return this.connection.query(queryOrCommand as any, parametersOrType as any, typeOrParameters as any);
    }
    public setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        return this.connection.setIsolationLevel(isolationLevel);
    }
    public get errorEvent() { return this.connection.errorEvent; }
}