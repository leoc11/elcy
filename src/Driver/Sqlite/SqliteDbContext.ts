import { DbContext } from "../../Data/DBContext";
import { PlainObjectQueryResultParser } from "../../QueryBuilder/ResultParser/PlainObjectQueryResultParser";
import { SqliteQueryBuilder } from "./SqliteQueryBuilder";
import { SqliteSchemaBuilder } from "./SqliteSchemaBuilder";
import { IDriver } from "../IDriver";
import { IConnectionManager } from "../../Connection/IConnectionManager";
export abstract class SqliteDbContext extends DbContext {
    public queryParser = PlainObjectQueryResultParser;
    public queryBuilder = SqliteQueryBuilder;
    public schemaBuilder = SqliteSchemaBuilder;
    constructor(driverFactory: () => IDriver<"sqlite">);
    constructor(connectionManagerFactory: () => IConnectionManager);
    constructor(factory: () => IConnectionManager | IDriver<"sqlite">) {
        super(factory);
    }
}
