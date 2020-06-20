import { IsolationLevel } from "../Common/StringType";
import { IEventHandler } from "../Event/IEventHandler";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";

export interface IConnection {
    database: string;
    errorEvent: IEventHandler<IConnection, Error>;
    inTransaction: boolean;
    readonly isolationLevel: IsolationLevel;
    isOpen: boolean;
    close(): Promise<void>;
    commitTransaction(): Promise<void>;
    open(): Promise<void>;
    query(...commands: IQuery[]): Promise<IQueryResult[]>;
    reset(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    setIsolationLevel(isolationLevel: IsolationLevel): Promise<void>;
    startTransaction(isolationLevel?: IsolationLevel): Promise<void>;
}
