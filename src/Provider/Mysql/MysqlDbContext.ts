import { NamingStrategy } from "../../Query/NamingStrategy";
import { POJOQueryResultParser } from "../../Query/POJOQueryResultParser";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { MysqlQueryBuilder } from "./MysqlQueryBuilder";
import { mysqlQueryTranslator } from "./MysqlQueryTranslator";
import { MysqlSchemaBuilder } from "./MySqlSchemaBuilder";

export abstract class MysqlDbContext extends RelationalDbContext<"mysql"> {
    protected namingStrategy = new NamingStrategy();
    protected queryBuilderType = MysqlQueryBuilder;
    protected queryResultParserType = POJOQueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected schemaBuilderType = MysqlSchemaBuilder;
    protected translator = mysqlQueryTranslator;
}
