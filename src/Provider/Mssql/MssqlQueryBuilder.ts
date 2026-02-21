import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { ObjectValueExpression } from "src/ExpressionBuilder/Expression/ObjectValueExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { HavingJoinRelation } from "src/Queryable/Interface/HavingJoinRelation";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { ComputedColumnExpression } from "src/Queryable/QueryExpression/ComputedColumnExpression";
import { GroupByExpression } from "src/Queryable/QueryExpression/GroupByExpression";
import { ColumnGeneration, QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, IObjectType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { isNotNull, mapReplaceExp } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { DbFunction } from "../../Query/DbFunction";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { MssqlColumnType } from "./MssqlColumnType";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { Enumerable } from "@elcy/enumerable";
import { ArrayExtension } from "src/Extensions/ArrayExtension";

export class MssqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 2100,
        maxQueryLength: 67108864
    };
    public translator = mssqlQueryTranslator;
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType<MssqlColumnType>>([
        [Uuid, () => ({ columnType: "uniqueidentifier", group: "Identifier" })],
        [TimeSpan, () => ({ columnType: "time", group: "Time" })],
        [Date, () => ({ columnType: "datetime", group: "DateTime" })],
        [String, (val: string) => ({ columnType: "nvarchar", group: "String", option: { length: 255 } })],
        [Number, () => ({ columnType: "decimal", group: "Decimal", option: { precision: 18, scale: 0 } })],
        [Boolean, () => ({ columnType: "bit", group: "Boolean" })]
    ]);
    public enclose(identity: string) {
        if (this.namingStrategy.enableEscape && identity[0] !== "@" && identity[0] !== "#") {
            return "[" + identity + "]";
        }
        else {
            return identity;
        }
    }
    public getInsertQuery<T>(insertExp: InsertExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: insertExp
        };
        const colString = insertExp.columns.map((o) => this.enclose(o.columnName)).join(", ");
        let output = Enumerable.from(insertExp.entity.columns).filter((o) => isNotNull(o.columnMeta))
            .filter((o) => (o.columnMeta.generation & ColumnGeneration.Insert) !== 0 || !!o.columnMeta.defaultExp)
            .map((o) => `INSERTED.${this.enclose(o.columnName)} AS ${o.propertyName}`)
            .toArray()
            .join(", ");
        if (output) {
            output = " OUTPUT " + output;
        }

        const insertQuery = `INSERT INTO ${this.enclose(insertExp.entity.name)}(${colString})${output} VALUES`;
        let queryCommand: IQuery = {
            query: insertQuery,
            parameters: new Map(),
            type: QueryType.DML
        };
        if (output) {
            queryCommand.type |= QueryType.DQL;
        }

        const result: IQuery[] = [queryCommand];
        let count = 0;
        this.indent++;
        for (const itemExp of insertExp.values) {
            const isLimitExceed = this.queryLimit.maxParameters && (count + insertExp.columns.length) > this.queryLimit.maxParameters;
            if (isLimitExceed) {
                queryCommand.query = queryCommand.query.slice(0, -1);
                queryCommand = {
                    query: insertQuery,
                    parameters: new Map(),
                    type: QueryType.DML
                };
                count = 0;
                result.push(queryCommand);
            }

            const values: string[] = [];
            for (const col of insertExp.columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    values.push(this.toString(valueExp, param));
                    const paramExp = param.parameters.get(valueExp);
                    if (paramExp) {
                        queryCommand.parameters.set(paramExp.name, paramExp.value);
                        count++;
                    }
                }
                else {
                    values.push("DEFAULT");
                }
            }

            queryCommand.query += `${this.newLine()}(${values.join(",")}),`;
        }
        this.indent--;
        queryCommand.query = queryCommand.query.slice(0, -1);

        return result;
    }

    protected override getSelectQuery<T extends object>(selectExp: SelectExpression<T>, option: IQueryOption, parameters: IQueryParameterMap, skipInclude = false): IQuery[] {
        let result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: selectExp,
            parameters: parameters,
            option: option
        };

        // subselect should not have include
        if (selectExp.isSubSelect) {
            skipInclude = true;
        }

        const take = this.extractValue(selectExp.paging.take, param) || 0;
        const skip = this.extractValue(selectExp.paging.skip, param) || 0;

        const distinct = selectExp.distinct ? " DISTINCT" : "";
        const top = skip <= 0 && take > 0 ? " TOP " + take : "";

        const selects = Enumerable.from(selectExp.projectedColumns)
            .map((o) => {
                let colStr = "";
                if (o instanceof ComputedColumnExpression) {
                    colStr = this.toOperandString(o.expression, param);
                }
                else {
                    colStr = this.enclose(o.entity.alias) + "." + this.enclose(o.columnName);
                }
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            })
            .toArray()
            .join("," + this.newLine(1, false));

        const entityQ = this.getEntityQueryString(selectExp.entity, param);

        if (selectExp instanceof GroupByExpression && !selectExp.isAggregate && selectExp.having && !Enumerable.from(selectExp.joins).ofType(HavingJoinRelation).some()) {
            const clone = selectExp.clone();
            clone.entity.alias = "rel_" + clone.entity.alias;
            clone.isAggregate = true;
            clone.distinct = true;
            clone.selects = clone.resolvedGroupBy.slice();

            let relation: IExpression<boolean>;
            for (const col of selectExp.resolvedGroupBy) {
                const cloneCol = clone.resolvedGroupBy.find((o) => o.dataPropertyName === col.dataPropertyName);
                const logicalExp = new StrictEqualExpression(col, cloneCol);
                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
            }

            const joinRel = clone.parentRelation = new JoinRelation(selectExp, clone, relation, "INNER");
            selectExp.joins.push(joinRel);
        }

        const joinStr = this.getJoinQueryString(selectExp.resolvedJoins, param) + this.getParentJoinQueryString(selectExp.parentRelation, param);

        let selectQuerySuffix = "";
        if (selectExp.where) {
            param.state = "column-declared";
            selectQuerySuffix += this.newLine() + "WHERE " + this.toLogicalString(selectExp.where, param);
            param.state = "";
        }

        if (selectExp instanceof GroupByExpression && selectExp.isAggregate) {
            if (selectExp.groupBy.length > 0) {
                selectQuerySuffix += this.newLine() + "GROUP BY " + selectExp.resolvedGroupBy.map((o) => this.getColumnQueryString(o, param)).join(", ");
            }
            if (selectExp.having) {
                selectQuerySuffix += this.newLine() + "HAVING " + this.toLogicalString(selectExp.having, param);
            }
        }

        if (selectExp.orders.length > 0 && (skip > 0 || take > 0 || !(selectExp.parentRelation instanceof JoinRelation))) {
            selectQuerySuffix += this.newLine() + "ORDER BY " + selectExp.orders.map((c) => this.toString(c.column, param) + " " + c.direction).join(", ");
        }

        if (skip > 0) {
            selectQuerySuffix += this.newLine() + this.getPagingQueryString(selectExp, take, skip);
        }

        const selectQuery = `SELECT${distinct}${top} ${selects}`
            + this.newLine() + `FROM ${entityQ}${joinStr}${selectQuerySuffix}`;

        if (!skipInclude) {
            // select each include as separated query as it more beneficial for performance
            for (const include of selectExp.resolvedIncludes) {
                if (!include.isManyToManyRelation) {
                    result = result.concat(this.getSelectQuery(include.child, param.option, param.parameters));
                }
                else {
                    // create relation data (clone select join clone child)
                    ArrayExtension.delete(selectExp.includes, include);
                    const cloneEntity = selectExp.entity.clone();
                    cloneEntity.isRelationData = true;
                    const relationData = new SelectExpression(cloneEntity);
                    cloneEntity.alias = "rel_" + cloneEntity.alias;

                    const childSelect = include.child;

                    const joinChildSelect = childSelect.clone();
                    joinChildSelect.entity.alias = "rel_" + joinChildSelect.entity.alias;

                    const relDataCloneMap = new Map();
                    mapReplaceExp(relDataCloneMap, childSelect, joinChildSelect);
                    mapReplaceExp(relDataCloneMap, selectExp, relationData);
                    relationData.includes = [];
                    relationData.addJoin(joinChildSelect, include.relation.clone(relDataCloneMap), "INNER");
                    relationData.selects = [];
                    relationData.itemExpression = new ObjectValueExpression({});
                    relationData.distinct = true;

                    // Bridge to Child relation
                    let bridgeChildRelation: IExpression<boolean>;
                    for (const childCol of childSelect.primaryKeys) {
                        const bridgeCol = relationData.allColumns.find((o) => o.columnName === childCol.columnName);
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(bridgeCol, childCol);
                        bridgeChildRelation = bridgeChildRelation ? new AndExpression(bridgeChildRelation, logicalExp) : logicalExp;
                    }
                    relationData.addInclude(include.name, childSelect, bridgeChildRelation, "one");

                    // Parent to Bridge relation
                    let parentBridgeRelation: IExpression<boolean>;
                    const cloneMap = new Map();
                    mapReplaceExp(cloneMap, selectExp.entity, relationData.entity);
                    for (const parentCol of selectExp.primaryKeys) {
                        let bridgeCol = relationData.allColumns.find((o) => o.columnName === parentCol.columnName);
                        if (!bridgeCol) {
                            bridgeCol = parentCol.clone(cloneMap);
                        }
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(parentCol, bridgeCol);
                        parentBridgeRelation = parentBridgeRelation ? new AndExpression(parentBridgeRelation, logicalExp) : logicalExp;
                    }
                    selectExp.addInclude(include.name, relationData, parentBridgeRelation, "many");

                    result = result.concat(this.getSelectQuery(relationData, param.option, param.parameters));
                }
            }
        }

        // select include before parent, coz result parser will parse include first before parent.
        // this way it will be much more easier to implement async iterator.
        result.push({
            query: selectQuery,
            type: QueryType.DQL,
            parameters: this.getParameter(param)
        });
        return result;
    }

    //#region Update
    public getUpdateQuery<T>(updateExp: UpdateExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: updateExp
        };

        const setQuery = Object.keys(updateExp.setter).map((o: keyof T) => {
            const value = updateExp.setter[o];
            const valueStr = this.toOperandString(value, param);
            const column = updateExp.entity.columns.find((c) => c.propertyName === o);
            return `${this.enclose(updateExp.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
        });

        if (updateExp.entity.metaData) {
            if (updateExp.entity.metaData.modifiedDateColumn) {
                const colMeta = updateExp.entity.metaData.modifiedDateColumn;
                // only update modifiedDate column if not explicitly specified in update set statement.
                if (!updateExp.setter[colMeta.propertyName]) {
                    const valueExp = new MethodCallExpression(new ValueExpression(DbFunction), colMeta.timeZoneHandling === "utc" ? "utcTimestamp" : "timestamp", []);
                    const valueStr = this.toString(valueExp, param);
                    setQuery.push(`${this.enclose(updateExp.entity.alias)}.${this.enclose(colMeta.columnName)} = ${valueStr}`);
                }
            }

            if (updateExp.entity.metaData.versionColumn) {
                const colMeta = updateExp.entity.metaData.versionColumn;
                if (updateExp.setter[colMeta.propertyName]) {
                    throw new Error(`${colMeta.propertyName} is a version column and should not be update explicitly`);
                }
            }
        }

        let updateQuery = `UPDATE ${this.enclose(updateExp.entity.alias)}` +
            this.newLine() + `SET ${setQuery.join(", ")}` +
            this.newLine() + `FROM ${this.enclose(updateExp.entity.name)} AS ${this.enclose(updateExp.entity.alias)}` +
            this.getJoinQueryString(updateExp.joins, param);
        if (updateExp.where) {
            updateQuery += this.newLine() + "WHERE " + this.toLogicalString(updateExp.where, param);
        }

        result.push({
            query: updateQuery,
            parameters: this.getParameter(param),
            type: QueryType.DML
        });

        return result;
    }
    public toParameterValue(input: any, column: IColumnMetaData): any {
        if (!isNotNull(input)) {
            return null;
        }
        if (column instanceof ColumnExpression && column.columnMeta instanceof RowVersionColumnMetaData) {
            return new Uint8Array(input.buffer ? input.buffer : input);
        }
        return super.toParameterValue(input, column);
    }
    //#endregion
    public toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T {
        if (column instanceof RowVersionColumnMetaData) {
            return new (column.type as IObjectType<T>)(input.buffer ? input.buffer : input);
        }
        return super.toPropertyValue(input, column);
    }
    protected getPagingQueryString(select: SelectExpression, take: number, skip: number): string {
        let result = "";
        if (select.orders.length <= 0) {
            result += "ORDER BY (SELECT NULL)" + this.newLine();
        }
        result += "OFFSET " + skip + " ROWS";
        if (take > 0) {
            result += this.newLine() + "FETCH NEXT " + take + " ROWS ONLY";
        }
        return result;
    }
    protected override booleanString(value: boolean) {
        return value ? "1" : "0";
    }
}
