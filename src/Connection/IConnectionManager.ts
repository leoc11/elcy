import { IConnection } from "./IConnection";
import { IDriver } from "./IDriver";

export interface IConnectionManager {
    readonly driver: IDriver;
    getAllConnections(): Promise<IConnection[]>;
    getConnection(writable?: boolean): Promise<IConnection>;
}
