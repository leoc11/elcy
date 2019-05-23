import { IConnection } from "./IConnection";
import { IDriver } from "./IDriver";

export interface IConnectionManager {
    readonly driver: IDriver;
    getConnection(writable?: boolean): Promise<IConnection>;
    getAllConnections(): Promise<IConnection[]>;
}
