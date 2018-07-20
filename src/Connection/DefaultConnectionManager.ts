import { IConnection } from "./IConnection";
import { IConnectionManager } from "./IConnectionManager";
import { IDriver } from "../Driver/IDriver";

export class DefaultConnectionManager implements IConnectionManager {
    constructor(protected driver: IDriver<any>) {

    }
    public getConnection(writable: boolean) {
        return this.driver.getConnection();
    }
    public release(connection: IConnection): Promise<void> {
        return connection.close();
    }
}