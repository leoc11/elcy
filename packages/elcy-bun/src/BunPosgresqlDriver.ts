import type { IDriver } from "@elcy/core/src/Connection/IDriver";
import { BunPosgresqlConnection } from "./BunPosgresqlConnection";
import { SQL } from "bun";

export class BunPosgresqlDriver implements IDriver<"postgresql"> {
    public dbType: "postgresql" = "postgresql";
    public allowPooling = false;
    protected _client?: SQL;
    constructor(public readonly database: string) { }
    public async getConnection(): Promise<BunPosgresqlConnection> {
        if (!this._client) {
            this._client = new SQL(this.database);
        }
        return new BunPosgresqlConnection(this._client);
    }
}
