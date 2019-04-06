import { DbContext } from "../../Data/DBContext";
import { POJOQueryResultParser } from "../../Query/POJOQueryResultParser";
import { IDriver } from "../../Connection/IDriver";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { MssqlSchemaBuilder } from "./MssqlSchemaBuilder";
import { IConnectionManager } from "../../Connection/IConnectionManager";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { EntityEntry } from "../../Data/EntityEntry";
import { DeferredQuery } from "../../Query/DeferredQuery";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { InsertExpression, insertEntryExp } from "../../Queryable/QueryExpression/InsertExpression";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { QueryType } from "../../Common/Type";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IQueryResult } from "../../Query/IQueryResult";
import { IQuery } from "../../Query/IQuery";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { RelationQueryVisitor } from "../Relation/RelationQueryVisitor";
import { IQueryVisitor } from "../../Query/IQueryVisitor";

export abstract class MssqlDbContext extends DbContext<"mssql"> {
    protected queryBuilderType = MssqlQueryBuilder;
    protected schemaBuilderType = MssqlSchemaBuilder;
    protected queryVisitorType = RelationQueryVisitor;
    protected queryResultParserType = POJOQueryResultParser;
    protected namingStrategy = new NamingStrategy();
    public dbType: "mssql" = "mssql";
    protected translator = mssqlQueryTranslator;
    constructor(driverFactory: () => IDriver<"mssql">);
    constructor(connectionManagerFactory: () => IConnectionManager);
    constructor(factory: () => IConnectionManager | IDriver<"mssql">) {
        super(factory);
    }
    protected getInsertQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: IQueryVisitor): DeferredQuery<IQueryResult>[] {
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

        const insertExp = new InsertExpression(entityExp, []);
        const queryParameters: IQueryParameterMap = new Map();
        entryEnumerable.each(entry => {
            insertEntryExp(insertExp, entry, columns, relations, queryParameters);
        });

        const insertQuery = new DeferredQuery<IQueryResult>(this, insertExp, queryParameters, (results, commands: IQuery[]) => {
            let rows: any[] = [];
            let effectedRows = 0;
            for (let index = 0, len = commands.length; index < len; index++) {
                const command = commands[index];
                const result = results[index];
                if ((command.type & QueryType.DQL) && result.rows) {
                    rows = rows.concat(Enumerable.from(result.rows).toArray());
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
