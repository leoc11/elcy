import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";

export class DefaultConnectionManager implements IConnectionManager {
    constructor(protected driver: IDriver<any>) { }
    public getConnection(writable?: boolean) {
        return this.driver.getConnection();
    }
    public async getAllServerConnections(): Promise<IConnection[]> {
        return [await this.driver.getConnection()];
    }
}