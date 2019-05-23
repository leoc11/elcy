import { IsolationLevel, QueryType } from "../Common/Type";
import { IEventHandler } from "../Event/IEventHandler";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";

export interface IConnection {
    isolationLevel: IsolationLevel;
    database: string;
    inTransaction: boolean;
    isOpen: boolean;
    errorEvent: IEventHandler<IConnection, Error>;
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
}
