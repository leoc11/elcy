import { DbContext } from "../../Data/DBContext";
import { IQuery } from "../../Query/IQuery";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { POJOQueryResultParser } from "../../Query/POJOQueryResultParser";
import { mssqlQueryTranslator } from "../Mssql/MssqlQueryTranslator";
import { RelationQueryVisitor } from "../Relation/RelationQueryVisitor";
import { SqliteQueryBuilder } from "./SqliteQueryBuilder";
import { SqliteSchemaBuilder } from "./SqliteSchemaBuilder";
const namingStrategy = new NamingStrategy();
export abstract class SqliteDbContext extends DbContext<"sqlite"> {
    public dbType: "sqlite" = "sqlite";
    public queryBuilderType = SqliteQueryBuilder;
    public queryParser = POJOQueryResultParser;
    public schemaBuilderType = SqliteSchemaBuilder;
    protected namingStrategy = namingStrategy;
    protected queryResultParserType = POJOQueryResultParser;
    protected queryVisitorType = RelationQueryVisitor;
    protected translator = mssqlQueryTranslator;
    public mergeQueryCommands(queries: IQuery[]): IQuery[] {
        return queries;
    }
}
