import { DbContext } from "../../Data/DBContext";
import { POJOQueryResultParser } from "../../QueryBuilder/ResultParser/POJOQueryResultParser";
import { IDriver } from "../IDriver";
import { MssqlQueryBuilder, mssqlQueryTranslator } from "./MssqlQueryBuilder";
import { MssqlSchemaBuilder } from "./MssqlSchemaBuilder";
import { IConnectionManager } from "../../Connection/IConnectionManager";
import { QueryVisitor } from "../../QueryBuilder/QueryVisitor";
import { NamingStrategy } from "../../QueryBuilder/NamingStrategy";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { EntityEntry } from "../../Data/EntityEntry";
import { DeferredQuery } from "../../QueryBuilder/DeferredQuery";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { ColumnGeneration, QueryType } from "../../Common/Type";
import { EntityState } from "../../Data/EntityState";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IQueryResult } from "../../QueryBuilder/IQueryResult";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";

export abstract class MssqlDbContext extends DbContext<"mssql"> {
    protected queryParser = POJOQueryResultParser;
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
    protected getInsertQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = new Enumerable(entries);
        if (!visitor) visitor = this.queryVisitor;
        const results: DeferredQuery[] = [];

        const columns = entityMetaData.columns;
        const relations = entityMetaData.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one");
        const relationDatas = relations.selectMany(o => o.relationColumns.select(c => ({
            column: c,
            relationProperty: o.propertyName,
            fullName: o.fullName,
            relationColumn: o.relationMaps.get(c)
        })));
        const relationColumns = relationDatas.select(o => o.column);
        const valueColumns = columns.except(relationColumns).except(entityMetaData.insertGeneratedColumns);

        const entityExp = new EntityExpression(entityMetaData.type, visitor.newAlias());
        let insertExp = new InsertExpression(entityExp, []);
        let queryParameters: ISqlParameter[] = [];
        const getEntryValues = (entry: EntityEntry<T>) => {
            const values: Array<IExpression | undefined> = [];
            let primaryKeyExp: IExpression<boolean>;
            relationDatas.each(o => {
                const parentEntity = entry.entity[o.relationProperty] as any;
                if (!parentEntity) {
                    throw new Error(`${o.relationProperty} cannot be null`);
                }

                const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), o.relationColumn.type), o.relationColumn);
                const parentHasGeneratedPrimary = parentEntry.metaData.primaryKeys.any(o => !!(o.generation & ColumnGeneration.Insert) || (o.default && parentEntity[o.propertyName] === undefined));
                if (parentEntry.state === EntityState.Added && parentHasGeneratedPrimary) {
                    // TODO: get value from parent.
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.dbSet.metaData).indexOf(parentEntry);
                    param = new SqlParameterExpression(`${parentEntry.metaData.name}`, new MemberAccessExpression(new ParameterExpression(index.toString(), parentEntry.metaData.type), o.relationColumn.columnName), o.relationColumn);
                    insertExp.parameters.push(param);
                }
                else {
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: parentEntity[o.relationColumn.propertyName]
                    };
                    queryParameters.push(paramv);
                }

                values.push(param);
                if (o.column.isPrimaryColumn) {
                    const eqExp = new StrictEqualExpression(insertExp.entity.primaryColumns.first(c => c.propertyName === o.column.propertyName), param);
                    primaryKeyExp = primaryKeyExp ? new AndExpression(primaryKeyExp, eqExp) : eqExp;
                }
            });

            valueColumns.each(o => {
                let value = entry.entity[o.propertyName as keyof T];
                if (value === undefined) {
                    if (o.default)
                        values.push(undefined);
                    else
                        values.push(new ValueExpression(null));
                }
                else {
                    let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), o.type), o);
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: value
                    };
                    queryParameters.push(paramv);

                    if (o.isPrimaryColumn) {
                        const eqExp = new StrictEqualExpression(insertExp.entity.primaryColumns.first(c => c.propertyName === o.propertyName), param);
                        primaryKeyExp = primaryKeyExp ? new AndExpression(primaryKeyExp, eqExp) : eqExp;
                    }
                }
            });

            insertExp.values.push(values);

            return primaryKeyExp;
        };

        let generatedColumns = entityMetaData.insertGeneratedColumns.asEnumerable();
        if (generatedColumns.any()) {
            generatedColumns = entityMetaData.primaryKeys.union(generatedColumns);
        }

        const selectExp = new SelectExpression(entityExp);
        selectExp.selects = generatedColumns.select(c => entityExp.columns.first(e => e.propertyName === c.propertyName)).toArray();

        entryEnumerable.each(entry => {
            getEntryValues(entry);
        });

        results.push(new DeferredQuery<IQueryResult>(this, insertExp, queryParameters, (results, commands: IQuery[]) => {
            let rows: any[] = [];
            let effectedRows = 0;
            commands.each((command, index) => {
                const result = results[index];
                if (command.type & QueryType.DQL && result.rows) {
                    rows = rows.concat(new Enumerable(result.rows).toArray());
                }
                if (command.type & QueryType.DML) {
                    effectedRows += result.effectedRows;
                }
            });
            return {
                rows: rows,
                effectedRows: effectedRows
            };
        }));

        return results;
    }
}
