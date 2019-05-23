import { IConnectionManager } from "../../Connection/IConnectionManager";
import { IDriver } from "../../Connection/IDriver";
import { DbContext } from "../../Data/DBContext";
import { IQuery } from "../../Query/IQuery";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { POJOQueryResultParser } from "../../Query/POJOQueryResultParser";
import { mssqlQueryTranslator } from "../Mssql/MssqlQueryTranslator";
import { RelationQueryVisitor } from "../Relation/RelationQueryVisitor";
import { SqliteQueryBuilder } from "./SqliteQueryBuilder";
import { SqliteSchemaBuilder } from "./SqliteSchemaBuilder";
const namingStrategy = new NamingStrategy();
export abstract class SqliteDbContext extends DbContext {
    public queryParser = POJOQueryResultParser;
    public queryBuilderType = SqliteQueryBuilder;
    public schemaBuilderType = SqliteSchemaBuilder;
    public dbType: any;
    protected queryVisitorType = RelationQueryVisitor;
    protected queryResultParserType = POJOQueryResultParser;
    protected namingStrategy = namingStrategy;
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
