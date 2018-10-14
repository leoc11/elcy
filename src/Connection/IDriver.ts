import { IConnection } from "./IConnection";
import { DbType } from "../Common/Type";

export interface IDriver<T extends DbType> {
    dbType: T;
    allowPooling: boolean;
    getConnection(): Promise<IConnection>;
    database: string;
    schema?: string;
}