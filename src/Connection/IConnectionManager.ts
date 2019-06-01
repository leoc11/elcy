import { DbType } from "../Common/Type";
import { IConnection } from "./IConnection";
import { IDriver } from "./IDriver";

export interface IConnectionManager<T extends DbType = any> {
    readonly driver: IDriver<T>;
    getAllConnections(): Promise<IConnection[]>;
    getConnection(writable?: boolean): Promise<IConnection>;
}
