import { IQueryResult } from "../QueryBuilder/QueryResult";
import { IEventHandler } from "../Event/IEventHandler";
import { IsolationLevel } from "../Common/Type";

export interface IConnection {
    database: string;
    inTransaction: boolean;
    isOpen: boolean;
    close(): Promise<void>;
    open(): Promise<void>;
    startTransaction(isolationLevel?: IsolationLevel): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    executeQuery(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    closeEvent: IEventHandler<IConnection, void>;
}