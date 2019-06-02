import { DbType } from "../Common/StringType";
import { IConnection } from "./IConnection";

export interface IDriver<T extends DbType = any> {
    allowPooling: boolean;
    database: string;
    dbType: T;
    schema?: string;
    supportTVP?: boolean;
    getConnection(): Promise<IConnection>;
}
