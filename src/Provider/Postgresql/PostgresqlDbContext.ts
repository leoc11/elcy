import { NamingStrategy } from "../../Query/NamingStrategy";
import { POJOQueryResultParser } from "../../Query/POJOQueryResultParser";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { PostgresqlQueryBuilder } from "./PostgresqlQueryBuilder";
import { postgresqlQueryTranslator } from "./PostgresqlQueryTranslator";
import { PostgresqlSchemaBuilder } from "./PostgresqlSchemaBuilder";

export abstract class PostgresqlDbContext extends RelationalDbContext<"postgresql"> {
    protected namingStrategy = new NamingStrategy();
    protected queryBuilderType = PostgresqlQueryBuilder;
    protected queryResultParserType = POJOQueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected schemaBuilderType = PostgresqlSchemaBuilder;
    protected translator = postgresqlQueryTranslator;
}
