import { ISqlServerConnectionOption } from "./ISqlServerConnectionOption";
import { IDriver } from "../IDriver";
import { SqlServerConnection } from "./SqlServerConnection";

export class SqlServerDriver implements IDriver<"mssql"> {
    public dbType: "mssql" = "mssql";
    public allowPooling = true;
    public get database() {
        return this.connectionOptions.database;
    }
    constructor(protected connectionOptions: ISqlServerConnectionOption) {
    }
    public async getConnection(): Promise<SqlServerConnection> {
        return new SqlServerConnection(this.connectionOptions);
    }
}
