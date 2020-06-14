import { EntityEntry } from "../../Data/EntityEntry";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { POJOQueryResultParser } from "../../Query/POJOQueryResultParser";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { MssqlSchemaBuilder } from "./MssqlSchemaBuilder";
import { MssqlInsertDeferredQuery } from "./Query/MssqlInsertDeferredQuery";

export abstract class MssqlDbContext extends RelationalDbContext<"mssql"> {
    protected namingStrategy = new NamingStrategy();
    protected queryBuilderType = MssqlQueryBuilder;
    protected queryResultParserType = POJOQueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected schemaBuilderType = MssqlSchemaBuilder;
    protected translator = mssqlQueryTranslator;

    public getInsertQuery<T>(entry: EntityEntry<T>) {
        return new MssqlInsertDeferredQuery(entry);
    }
}
