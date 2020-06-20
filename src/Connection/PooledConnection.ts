import { IsolationLevel } from "../Common/StringType";
import { PoolResource } from "../Pool/PoolResource";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";
import { IConnection } from "./IConnection";

export class PooledConnection extends PoolResource implements IConnection {
    public get database() {
        return this.connection.database;
    }
    public get errorEvent() {
        return this.connection.errorEvent;
    }
    public get inTransaction() {
        return this.connection.inTransaction;
    }
    public get isolationLevel() {
        return this.connection.isolationLevel;
    }
    public get isOpen() {
        return this.connection.isOpen;
    }
    constructor(public connection: IConnection) {
        super();
    }
    public destroy(): void {
        this.connection.close();
    }
    public async close(): Promise<void> {
        this.onReleased();
    }
    public commitTransaction(): Promise<void> {
        return this.connection.commitTransaction();
    }
    public open(): Promise<void> {
        return this.connection.open();
    }
    public query(...command: IQuery[]): Promise<IQueryResult[]> {
        return this.connection.query(...command);
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
    public startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        return this.connection.startTransaction(isolationLevel);
    }
}
