import { QueryType } from "../Common/Enum";
import { IsolationLevel } from "../Common/StringType";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";
import { IConnection } from "./IConnection";
import { PoolResource } from "../Pool/PoolResource";

export class PooledConnection extends PoolResource implements IConnection {
    public destroy(): void {
        this.connection.close();
    }
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
    constructor(public connection: IConnection) { 
        super();
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
