import { DbType } from "../Common/Type";
import { IConnection } from "../Connection/IConnection";
import { IDriver } from "../Connection/IDriver";
import { MockConnection } from "./MockConnection";

export interface IMockDriverOption<T> {
    database?: string;
    dbType?: T;
    allowPooling?: boolean;
    schema?: string;
}

export class MockDriver<T extends DbType = any> implements IDriver<T> {
    public dbType: any;
    public allowPooling = true;
    public database: string;
    public schema?: string;
    constructor(option?: IMockDriverOption<T>) {
        if (option) {
            this.database = option.database;
            this.allowPooling = option.allowPooling;
            this.dbType = option.dbType;
            this.schema = option.schema;
        }
    }
    public async getConnection(): Promise<IConnection> {
        return new MockConnection(this.database);
    }
}
