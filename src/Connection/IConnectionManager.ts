import { IConnection } from "./IConnection";

export interface IConnectionManager {
    getConnection(writable?: boolean): Promise<IConnection>;
    getAllServerConnections(): Promise<IConnection[]>;
}