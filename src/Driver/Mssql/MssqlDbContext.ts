import { DbContext } from "../../Data/DBContext";
import { POJOQueryResultParser } from "../../QueryBuilder/ResultParser/POJOQueryResultParser";
import { IDriver } from "../../Connection/IDriver";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { MssqlSchemaBuilder } from "./MssqlSchemaBuilder";
import { IConnectionManager } from "../../Connection/IConnectionManager";
import { QueryVisitor } from "../../QueryBuilder/QueryVisitor";
import { NamingStrategy } from "../../QueryBuilder/NamingStrategy";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { EntityEntry } from "../../Data/EntityEntry";
import { DeferredQuery } from "../../QueryBuilder/DeferredQuery";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { InsertExpression, insertEntryExp } from "../../Queryable/QueryExpression/InsertExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { QueryType } from "../../Common/Type";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IQueryResult } from "../../QueryBuilder/IQueryResult";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";

export abstract class MssqlDbContext extends DbContext<"mssql"> {
    protected queryBuilderType = MssqlQueryBuilder;
    protected schemaBuilderType = MssqlSchemaBuilder;
    protected queryVisitorType = QueryVisitor;
    protected queryResultParserType = POJOQueryResultParser;
    protected namingStrategy = new NamingStrategy();
    public dbType: "mssql" = "mssql";
    protected translator = mssqlQueryTranslator;
    constructor(driverFactory: () => IDriver<"mssql">);
    constructor(connectionManagerFactory: () => IConnectionManager);
    constructor(factory: () => IConnectionManager | IDriver<"mssql">) {
        super(factory);
    }
    protected getInsertQueries2<T>(entityMetaData: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = Enumerable.from(entries);
        if (!visitor) visitor = this.queryVisitor;
        const results: DeferredQuery[] = [];

        if (!entryEnumerable.any()) return results;

        const entityExp = new EntityExpression<T>(entityMetaData.type, visitor.newAlias());
        const relations = entityMetaData.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        let columns = relations.selectMany(o => o.relationColumns)
            .union(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns).distinct();

        let generatedColumns = entityMetaData.insertGeneratedColumns.asEnumerable();
        if (generatedColumns.any()) {
            generatedColumns = entityMetaData.primaryKeys.union(generatedColumns);
        }

        const insertExp = new InsertExpression(entityExp, []);
        const queryParameters: ISqlParameter[] = [];
        entryEnumerable.each(entry => {
            insertEntryExp(insertExp, entry, columns, relations, visitor, queryParameters);
        });

        const insertQuery = new DeferredQuery<IQueryResult>(this, insertExp, queryParameters, (results, commands: IQuery[]) => {
            let rows: any[] = [];
            let effectedRows = 0;
            commands.each((command, index) => {
                const result = results[index];
                if ((command.type & QueryType.DQL) && result.rows) {
                    rows = rows.concat(Enumerable.from(result.rows).toArray());
                }
                if (command.type & QueryType.DML) {
                    effectedRows += result.effectedRows;
                }
            });
            return {
                rows: rows,
                effectedRows: effectedRows
            };
        });
        results.push(insertQuery);

        return results;
    }
}
