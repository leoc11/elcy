import { DbContext } from "../../Data/DBContext";
import { POJOQueryResultParser } from "../../QueryBuilder/ResultParser/POJOQueryResultParser";
import { SqliteQueryBuilder } from "./SqliteQueryBuilder";
import { SqliteSchemaBuilder } from "./SqliteSchemaBuilder";
import { IDriver } from "../IDriver";
import { IConnectionManager } from "../../Connection/IConnectionManager";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { QueryVisitor } from "../../QueryBuilder/QueryVisitor";
import { NamingStrategy } from "../../QueryBuilder/NamingStrategy";
import { mssqlQueryTranslator } from "../Mssql/MssqlQueryBuilder";
const namingStrategy = new NamingStrategy();
export abstract class SqliteDbContext extends DbContext {
    public queryParser = POJOQueryResultParser;
    public queryBuilderType = SqliteQueryBuilder;
    public schemaBuilderType = SqliteSchemaBuilder;
    protected queryVisitorType = QueryVisitor;
    protected queryResultParserType = POJOQueryResultParser;
    protected namingStrategy = namingStrategy;
    public dbType: any;
    protected translator = mssqlQueryTranslator;
    constructor(driverFactory: () => IDriver<"sqlite">);
    constructor(connectionManagerFactory: () => IConnectionManager);
    constructor(factory: () => IConnectionManager | IDriver<"sqlite">) {
        super(factory);
    }
    public mergeQueryCommands(queries: IQuery[]): IQuery[] {
        return queries;
    }
}
