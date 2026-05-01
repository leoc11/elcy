import { DbType } from "../Common/StringType";
import { IConnection } from "./IConnection";
import { IDriver } from "./IDriver";

export interface IConnectionManager<T extends DbType = DbType> {
    readonly driver: IDriver<T>;
    getAllConnections(): Promise<IConnection[]>;
    getConnection(writable?: boolean): Promise<IConnection>;
}
