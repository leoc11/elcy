import { DbContext } from "../../Data/DBContext";
import { PlainObjectQueryResultParser } from "../../QueryBuilder/ResultParser/PlainObjectQueryResultParser";
import { SqliteQueryBuilder } from "./SqliteQueryBuilder";
import { SqliteSchemaBuilder } from "./SqliteSchemaBuilder";
import { IDriver } from "../IDriver";
import { IConnectionManager } from "../../Connection/IConnectionManager";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";
import { QueryVisitor } from "../../QueryBuilder/QueryVisitor";
import { NamingStrategy } from "../../QueryBuilder/NamingStrategy";
import { mssqlQueryTranslator } from "../Mssql/MssqlQueryBuilder";
const namingStrategy = new NamingStrategy();
export abstract class SqliteDbContext extends DbContext {
    public queryParser = PlainObjectQueryResultParser;
    public queryBuilderType = SqliteQueryBuilder;
    public schemaBuilderType = SqliteSchemaBuilder;
    protected queryVisitorType = QueryVisitor;
    protected queryResultParserType = PlainObjectQueryResultParser;
    protected namingStrategy = namingStrategy;
    public dbType: any;
    protected translator = mssqlQueryTranslator;
    constructor(driverFactory: () => IDriver<"sqlite">);
    constructor(connectionManagerFactory: () => IConnectionManager);
    constructor(factory: () => IConnectionManager | IDriver<"sqlite">) {
        super(factory);
    }
    public mergeQueryCommands(queries: IQueryCommand[]): IQueryCommand[] {
        return queries;
    }
}
