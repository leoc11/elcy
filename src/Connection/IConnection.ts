import { QueryType } from "../Common/Enum";
import { IsolationLevel } from "../Common/StringType";
import { IEventHandler } from "../Event/IEventHandler";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";

export interface IConnection {
    database: string;
    errorEvent: IEventHandler<IConnection, Error>;
    inTransaction: boolean;
    isolationLevel: IsolationLevel;
    isOpen: boolean;
    close(): Promise<void>;
    commitTransaction(): Promise<void>;
    open(): Promise<void>;
    query<T = unknown>(command: IQuery): Promise<IQueryResult<T>[]>;
    query<T = unknown>(query: string, parameters?: Map<string, unknown>): Promise<IQueryResult<T>[]>;
    query<T = unknown>(query: string, type?: QueryType, parameters?: Map<string, unknown>): Promise<IQueryResult<T>[]>;
    reset(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    setIsolationLevel(isolationLevel: IsolationLevel): Promise<void>;
    startTransaction(isolationLevel?: IsolationLevel): Promise<void>;
}
