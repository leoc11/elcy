import { DbType } from "../Common/Type";
import { IConnection } from "./IConnection";

export interface IDriver<T extends DbType = any> {
    dbType: T;
    allowPooling: boolean;
    database: string;
    schema?: string;
    supportTVP?: boolean;
    getConnection(): Promise<IConnection>;
}
