import { ISqliteConnectionOption } from "./ISqliteConnectionOption";
import { IDriver } from "../../Connection/IDriver";
import { SqliteConnection } from "./SqliteConnection";

export class SqliteDriver implements IDriver<"sqlite"> {
    public dbType: "sqlite" = "sqlite";
    public allowPooling = false;
    public get database() {
        return this.connectionOptions.database;
    }
    private driverConnectionOption: any;
    protected getConnectionOptions() {
        return this.connectionOptions;
    }
    constructor(protected connectionOptions: ISqliteConnectionOption) {
        this.driverConnectionOption = this.getConnectionOptions();
    }
    public async getConnection(): Promise<SqliteConnection> {
        return new SqliteConnection(this.driverConnectionOption);
    }
}
