import { NamingStrategy } from "../../Query/NamingStrategy";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { PostgresqlQueryBuilder } from "./PostgresqlQueryBuilder";
import { postgresqlQueryTranslator } from "./PostgresqlQueryTranslator";
import { PostgresqlSchemaBuilder } from "./PostgresqlSchemaBuilder";
import { QueryResultParser } from "src/Query/QueryResultParser";
import { ProviderDbType } from "./Type";

export abstract class PostgresqlDbContext extends RelationalDbContext<ProviderDbType> {
    protected namingStrategy = new NamingStrategy();
    protected queryBuilderType = PostgresqlQueryBuilder;
    protected queryResultParserType = QueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected schemaBuilderType = PostgresqlSchemaBuilder;
    protected override translator = postgresqlQueryTranslator;
}
