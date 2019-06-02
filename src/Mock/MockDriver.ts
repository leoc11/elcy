import { DbType } from "../Common/StringType";
import { IConnection } from "../Connection/IConnection";
import { IDriver } from "../Connection/IDriver";
import { MockConnection } from "./MockConnection";

export interface IMockDriverOption<T> {
    allowPooling?: boolean;
    database?: string;
    dbType?: T;
    schema?: string;
}

export class MockDriver<T extends DbType = any> implements IDriver<T> {
    constructor(option?: IMockDriverOption<T>) {
        if (option) {
            this.database = option.database;
            this.allowPooling = option.allowPooling;
            this.dbType = option.dbType;
            this.schema = option.schema;
        }
    }
    public allowPooling = true;
    public database: string;
    public dbType: any;
    public schema?: string;
    public async getConnection(): Promise<IConnection> {
        return new MockConnection(this.database);
    }
}
