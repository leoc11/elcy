import { DbType } from "../Common/Type";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";

export class DefaultConnectionManager<T extends DbType = any> implements IConnectionManager<T> {
    constructor(public readonly driver: IDriver<T>) { }
    public async getAllConnections(): Promise<IConnection[]> {
        return [await this.driver.getConnection()];
    }
    public getConnection(writable?: boolean) {
        return this.driver.getConnection();
    }
}
