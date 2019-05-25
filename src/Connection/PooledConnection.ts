import { IsolationLevel, QueryType } from "../Common/Type";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";
import { IConnection } from "./IConnection";
import { PooledConnectionManager } from "./PooledConnectionManager";

export class PooledConnection implements IConnection {
    public get database() {
        return this.connection.database;
    }
    public set database(value) {
        this.connection.database = value;
    }
    public get errorEvent() {
        return this.connection.errorEvent;
    }
    public get inTransaction() {
        return this.connection.inTransaction;
    }
    public set inTransaction(value) {
        this.connection.inTransaction = value;
    }
    public get isolationLevel() {
        return this.connection.isolationLevel;
    }
    public set isolationLevel(value) {
        this.connection.isolationLevel = value;
    }
    public get isOpen() {
        return this.connection.isOpen;
    }
    public set isOpen(value) {
        this.connection.isOpen = value;
    }
    constructor(public connection: IConnection, private manager: PooledConnectionManager) { }
    public close(): Promise<void> {
        return this.manager.release(this);
    }
    public commitTransaction(): Promise<void> {
        return this.connection.commitTransaction();
    }
    public open(): Promise<void> {
        return this.connection.open();
    }
    public query(command: IQuery): Promise<IQueryResult[]>;
    public query(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    public query(query: string, type?: QueryType, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    public query(queryOrCommand: string | IQuery, parametersOrType?: Map<string, any> | QueryType, typeOrParameters?: QueryType | Map<string, any>): Promise<IQueryResult[]> {
        return this.connection.query(queryOrCommand as any, parametersOrType as any, typeOrParameters as any);
    }
    public reset(): Promise<void> {
        return this.connection.reset();
    }
    public rollbackTransaction(): Promise<void> {
        return this.connection.rollbackTransaction();
    }
    public setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        return this.connection.setIsolationLevel(isolationLevel);
    }
    public startTransaction(): Promise<void> {
        return this.connection.startTransaction();
    }
}
