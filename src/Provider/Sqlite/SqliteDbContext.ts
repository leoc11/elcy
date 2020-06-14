import { IQuery } from "../../Query/IQuery";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { POJOQueryResultParser } from "../../Query/POJOQueryResultParser";
import { mssqlQueryTranslator } from "../Mssql/MssqlQueryTranslator";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { SqliteQueryBuilder } from "./SqliteQueryBuilder";
import { SqliteSchemaBuilder } from "./SqliteSchemaBuilder";
const namingStrategy = new NamingStrategy();
export abstract class SqliteDbContext extends RelationalDbContext<"sqlite"> {
    public queryBuilderType = SqliteQueryBuilder;
    public queryParser = POJOQueryResultParser;
    public schemaBuilderType = SqliteSchemaBuilder;
    protected namingStrategy = namingStrategy;
    protected queryResultParserType = POJOQueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected translator = mssqlQueryTranslator;
    public mergeQueryCommands(queries: IQuery[]): IQuery[] {
        return queries;
    }
}
