import { QueryType } from "../../Common/Type";
import { EntityEntry } from "../../Data/EntityEntry";
import { IEnumerable } from "../../Enumerable/IEnumerable";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { DeferredQuery } from "../../Query/DeferredQuery";
import { IQuery } from "../../Query/IQuery";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { IQueryResult } from "../../Query/IQueryResult";
import { IQueryVisitor } from "../../Query/IQueryVisitor";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { POJOQueryResultParser } from "../../Query/POJOQueryResultParser";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { insertEntryExp, InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { MssqlSchemaBuilder } from "./MssqlSchemaBuilder";

export abstract class MssqlDbContext extends RelationalDbContext<"mssql"> {
    public dbType: "mssql" = "mssql";
    protected namingStrategy = new NamingStrategy();
    protected queryBuilderType = MssqlQueryBuilder;
    protected queryResultParserType = POJOQueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected schemaBuilderType = MssqlSchemaBuilder;
    protected translator = mssqlQueryTranslator;
    protected getInsertQueries<T>(entityMetaData: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor): Array<DeferredQuery<IQueryResult>> {
        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const results: DeferredQuery[] = [];

        if (!entries.any()) {
            return results;
        }

        const entityExp = new EntityExpression<T>(entityMetaData.type, visitor.newAlias());
        const relations = entityMetaData.relations
            .where((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        const columns = relations.selectMany((o) => o.relationColumns)
            .union(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns).distinct();

        const insertExp = new InsertExpression(entityExp, []);
        const queryParameters: IQueryParameterMap = new Map();
        for (const entry of entries) {
            insertEntryExp(insertExp, entry, columns, relations, queryParameters);
        }

        const insertQuery = new DeferredQuery<IQueryResult>(this, insertExp, queryParameters, (queryRes, commands: IQuery[]) => {
            let rows: IEnumerable = [];
            let effectedRows = 0;
            for (let index = 0, len = commands.length; index < len; index++) {
                const command = commands[index];
                const result = queryRes[index];
                if ((command.type & QueryType.DQL) && result.rows) {
                    rows = rows.union(result.rows);
                }
                if (command.type & QueryType.DML) {
                    effectedRows += result.effectedRows;
                }
            }

            return {
                rows: rows,
                effectedRows: effectedRows
            };
        }, {});
        results.push(insertQuery);

        return results;
    }
}
