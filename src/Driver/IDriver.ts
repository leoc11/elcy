import { IQueryResult } from "../QueryBuilder/QueryResult";

export interface IDriver {
    database: string;
    schema?: string;
    executeQuery(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    startTransaction(): Promise<any>;
    commitTransaction(): Promise<any>;
    rollbackTransaction(): Promise<any>;
}