import { IEnumerable, Enumerable } from "@elcy/enumerable";
import { FlatObjectLike } from "src/Common/Type";
import { EntityEntry } from "src/Data/EntityEntry";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { DeferredQuery } from "src/Query/DeferredQuery";
import { IQueryOption } from "src/Query/IQueryOption";
import { IQueryParameterMap } from "src/Query/IQueryParameter";
import { IQueryResult } from "src/Query/IQueryResult";
import { IQueryVisitor } from "src/Query/IQueryVisitor";
import { EntityExpression } from "src/Queryable/QueryExpression/EntityExpression";
import { InsertExpression, insertEntryExp } from "src/Queryable/QueryExpression/InsertExpression";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { RelationalDbContext } from "../Relational/RelationalDbContext";
import { RelationalQueryVisitor } from "../Relational/RelationalQueryVisitor";
import { PostgresqlQueryBuilder } from "./PostgresqlQueryBuilder";
import { postgresqlQueryTranslator } from "./PostgresqlQueryTranslator";
import { PostgresqlSchemaBuilder } from "./PostgresqlSchemaBuilder";
import { ColumnExpression } from "src/Queryable/QueryExpression/ColumnExpression";
import { ParameterExpression } from "src/ExpressionBuilder/Expression/ParameterExpression";
import { UpdateExpression, updateItemExp } from "src/Queryable/QueryExpression/UpdateExpression";
import { QueryResultParser } from "src/Query/QueryResultParser";
import { QueryType } from "src/Common/Enum";

export abstract class PostgresqlDbContext extends RelationalDbContext<"postgresql"> {
    protected namingStrategy = new NamingStrategy();
    protected queryBuilderType = PostgresqlQueryBuilder;
    protected queryResultParserType = QueryResultParser;
    protected queryVisitorType = RelationalQueryVisitor;
    protected schemaBuilderType = PostgresqlSchemaBuilder;
    protected override translator = postgresqlQueryTranslator;

    protected override getInsertQueries<T extends object>(entityMeta: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> {
        const results: Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> = [];
        if (!entries.some(() => true)) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const entityExp = new EntityExpression<T>(entityMeta.type, visitor.newAlias());
        const relations = Enumerable.from(entityMeta.relations)
            .filter((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        const columns = relations.flatMap((o) => o.relationColumns)
            .union(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns).distinct();

        const insertExp = new InsertExpression<T>(entityExp, []);
        const queryParameters: IQueryParameterMap = new Map();
        for (const entry of entries) {
            insertEntryExp(insertExp, entry, columns, relations, queryParameters);
        }

        let generatedColumns = Enumerable.from(entityMeta.insertGeneratedColumns).union(Enumerable.from(entityMeta.columns).filter((o) => !!o.defaultExp));
        const hasGeneratedColumn = generatedColumns.some();
        if (hasGeneratedColumn) {
            insertExp.returnings = generatedColumns.map(o => new ColumnExpression(insertExp.entity, o)).toArray();
        }

        const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (queryRes) => {
            return {
                effectedRows: Enumerable.from(queryRes).sum((o) => o.effectedRows),
                rows: Enumerable.from(queryRes).flatMap((o) => o.rows)
            } as IQueryResult<FlatObjectLike<T>>;
        }, option);
        results.push(insertQuery);
        return results;
    }

    protected override getUpdateQueries<T extends object>(entityMetaData: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> {
        const results: Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> = [];
        if (!entries.some(() => true)) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }

        const entityExp = new EntityExpression(entityMetaData.type, visitor.newAlias());
        for (const entry of entries) {
            const updateExp = new UpdateExpression(entityExp, {});
            const queryParameters: IQueryParameterMap = new Map();

            let pkFilter: IExpression<boolean>;
            for (const colExp of updateExp.entity.primaryColumns) {
                const parameter = new SqlParameterExpression(new ParameterExpression("", colExp.type), colExp.columnMeta);
                queryParameters.set(parameter, { value: entry.entity[colExp.propertyName as keyof T] });
                const compExp = new StrictEqualExpression(colExp, parameter);
                pkFilter = pkFilter ? new AndExpression(pkFilter, compExp) : compExp;
            }

            updateExp.addWhere(pkFilter);
            updateItemExp(updateExp, entry, queryParameters);
            if (entityMetaData.updateGeneratedColumns.length) {
                updateExp.returnings = entityMetaData.updateGeneratedColumns.map(o => new ColumnExpression(updateExp.entity, o));
            }

            const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (queryMap) => {
                let rows = Enumerable.from<unknown>([]);
                let effectedRows = 0;
                for (const [command, result] of queryMap) {
                    if ((command.type & QueryType.DQL) && result.rows) {
                        rows = rows.concat(result.rows);
                    }
                    if (command.type & QueryType.DML) {
                        effectedRows += result.effectedRows;
                    }
                }

                if (entityMetaData.concurrencyMode !== "NONE" && effectedRows <= 0) {
                    throw new Error("Concurrency Error");
                }
                return {
                    effectedRows: effectedRows,
                    rows: rows
                } as IQueryResult<FlatObjectLike<T>>;
            }, option);
            results.push(updateQuery);
        }

        return results;
    }
}
