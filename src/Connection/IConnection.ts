import { IQueryResult } from "../QueryBuilder/IQueryResult";
import { IEventHandler } from "../Event/IEventHandler";
import { IsolationLevel } from "../Common/Type";
import { IQuery } from "../QueryBuilder/Interface/IQuery";

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
    executeQuery(command: IQuery): Promise<IQueryResult[]>;
    setIsolationLevel(isolationLevel: IsolationLevel): Promise<void>;
    closeEvent: IEventHandler<IConnection, void>;
}