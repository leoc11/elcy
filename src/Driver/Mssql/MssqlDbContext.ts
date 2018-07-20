import { DbContext } from "../../Data/DBContext";
import { PlainObjectQueryResultParser } from "../../QueryBuilder/ResultParser/PlainObjectQueryResultParser";
import { IDriver } from "../IDriver";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { MssqlSchemaBuilder } from "./MssqlSchemaBuilder";
import { IConnectionManager } from "../../Connection/IConnectionManager";

export abstract class MssqlDbContext extends DbContext<"mssql"> {
    public queryParser = PlainObjectQueryResultParser;
    public queryBuilder = MssqlQueryBuilder;
    public schemaBuilder = MssqlSchemaBuilder;
    constructor(driverFactory: () => IDriver<"mssql">);
    constructor(connectionManagerFactory: () => IConnectionManager);
    constructor(factory: () => IConnectionManager | IDriver<"mssql">) {
        super(factory);
    }
}
