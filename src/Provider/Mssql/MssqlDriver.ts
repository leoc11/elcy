import { IMssqlConnectionOption } from "./IMssqlConnectionOption";
import { IDriver } from "../../Connection/IDriver";
import { MssqlConnection } from "./MssqlConnection";

export class MssqlDriver implements IDriver<"mssql"> {
    public dbType: "mssql" = "mssql";
    public allowPooling = true;
    public get database() {
        return this.connectionOptions.database;
    }
    private driverConnectionOption: any;
    protected getConnectionOptions() {
        const config = Object.assign({}, this.connectionOptions) as any;
        const host = this.connectionOptions.host.split("\\");
        config.userName = this.connectionOptions.user;
        config.options = {
            database: this.connectionOptions.database
        };
        config.server = host[0];
        if (!config.options)
            config.options = { appName: "lc-framework" };
        else if (!config.options.appName)
            config.options.appName = "lc-framework";
        if (typeof config.options.encrypt === "boolean")
            config.options.encrypt = false;

        config.options.instanceName = host[1];
        config.options.useUTC = false;
        return config;
    }
    constructor(protected connectionOptions: IMssqlConnectionOption) {
        this.driverConnectionOption = this.getConnectionOptions();
    }
    public async getConnection(): Promise<MssqlConnection> {
        return new MssqlConnection(this.driverConnectionOption);
    }
}
