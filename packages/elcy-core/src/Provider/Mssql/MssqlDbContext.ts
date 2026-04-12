import { NamingStrategy } from "../../Query/NamingStrategy";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { MssqlSchemaBuilder } from "./MssqlSchemaBuilder";
import { QueryResultParser } from "src/Query/QueryResultParser";

export abstract class MssqlDbContext extends RelationalDbContext<"mssql"> {
    protected namingStrategy = new NamingStrategy();
    protected queryBuilderType = MssqlQueryBuilder;
    protected queryResultParserType = QueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected schemaBuilderType = MssqlSchemaBuilder;
    protected translator = mssqlQueryTranslator;
}
