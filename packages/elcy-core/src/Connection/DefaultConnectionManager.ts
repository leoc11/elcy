import { DbType } from "../Common/StringType";
import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";

export class DefaultConnectionManager<T extends DbType = DbType> implements IConnectionManager<T> {
    constructor(public readonly driver: IDriver<T>) { }
    public async getAllConnections(): Promise<IConnection[]> {
        return [await this.driver.getConnection()];
    }
    public getConnection() {
        return this.driver.getConnection();
    }
}
