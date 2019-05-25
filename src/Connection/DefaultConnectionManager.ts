import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "./IDriver";

export class DefaultConnectionManager implements IConnectionManager {
    constructor(public readonly driver: IDriver<any>) { }
    public async getAllConnections(): Promise<IConnection[]> {
        return [await this.driver.getConnection()];
    }
    public getConnection(writable?: boolean) {
        return this.driver.getConnection();
    }
}
