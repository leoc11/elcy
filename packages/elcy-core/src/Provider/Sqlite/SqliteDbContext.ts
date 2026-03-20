import { QueryResultParser } from "src/Query/QueryResultParser";
import { IQuery } from "../../Query/IQuery";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { mssqlQueryTranslator } from "../Mssql/MssqlQueryTranslator";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { SqliteQueryBuilder } from "./SqliteQueryBuilder";
import { SqliteSchemaBuilder } from "./SqliteSchemaBuilder";
const namingStrategy = new NamingStrategy();
export abstract class SqliteDbContext extends RelationalDbContext<"sqlite"> {
    public queryBuilderType = SqliteQueryBuilder;
    public queryParser = QueryResultParser;
    public schemaBuilderType = SqliteSchemaBuilder;
    protected namingStrategy = namingStrategy;
    protected queryResultParserType = QueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected translator = mssqlQueryTranslator;
    public mergeQueryCommands(queries: IQuery[]): IQuery[] {
        return queries;
    }
}
