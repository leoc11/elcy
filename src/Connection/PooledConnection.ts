import { IConnection } from "./IConnection";
import { IQuery } from "../QueryBuilder/Interface/IQuery";
import { IQueryResult } from "../QueryBuilder/IQueryResult";
import { IsolationLevel } from "../Common/Type";
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
    public executeQuery(command: IQuery): Promise<IQueryResult[]> {
        return this.connection.executeQuery(command);
    }
    public setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        return this.connection.setIsolationLevel(isolationLevel);
    }
    public get errorEvent() { return this.connection.errorEvent; }
}