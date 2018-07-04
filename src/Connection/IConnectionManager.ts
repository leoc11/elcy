import { IConnection } from "./IConnection";

export interface IConnectionManager {
    getConnection(writable?: boolean): Promise<IConnection>;
    release(connection: IConnection): Promise<void>;
}