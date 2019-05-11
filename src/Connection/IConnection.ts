import { IQueryResult } from "../Query/IQueryResult";
import { IEventHandler } from "../Event/IEventHandler";
import { IsolationLevel, QueryType } from "../Common/Type";
import { IQuery } from "../Query/IQuery";

export interface IConnection {
    isolationLevel: IsolationLevel;
    database: string;
    inTransaction: boolean;
    isOpen: boolean;
    close(): Promise<void>;
    open(): Promise<void>;
    reset(): Promise<void>;
    startTransaction(isolationLevel?: IsolationLevel): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    query(command: IQuery): Promise<IQueryResult[]>;
    query(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    query(query: string, type?: QueryType, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    setIsolationLevel(isolationLevel: IsolationLevel): Promise<void>;
    errorEvent: IEventHandler<IConnection, Error>;
}