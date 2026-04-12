import { Enumerable } from "@elcy/enumerable";
import { QueryType } from "src/Common/Enum";
import { IQuery } from "src/Query/IQuery";
import { IQueryBuilderContext } from "src/Query/IQueryBuilderContext";
import { IQueryOption } from "src/Query/IQueryOption";
import { IQueryParameterValue, ISqlParameterValueMap } from "src/Query/IQueryParameter";
import { InsertExpression } from "src/Queryable/QueryExpression/InsertExpression";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, SetterObj, StringKeyOf, ValueType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { MysqlColumnType } from "./MysqlColumnType";
import { EntityExpression } from "src/Queryable/QueryExpression/EntityExpression";
import { IntegerColumnMetaData } from "src/MetaData/IntegerColumnMetaData";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { RawSqlExpression } from "src/Queryable/QueryExpression/RawSqlExpression";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";
import { ParameterExpression } from "src/ExpressionBuilder/Expression/ParameterExpression";
import { isNotNull } from "src/Helper/Util";
import { SqlTableValueParameterExpression } from "src/Queryable/QueryExpression/SqlTableValueParameterExpression";
import { ColumnExpression } from "src/Queryable/QueryExpression/ColumnExpression";
import { IMysqlQueryBuilderContext } from "./IMysqlQueryBuilderContext";
import { IQueryExpression } from "src/Queryable/QueryExpression/IQueryExpression";
import { UpdateExpression } from "src/Queryable/QueryExpression/UpdateExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { ProjectionEntityExpression } from "src/Queryable/QueryExpression/ProjectionEntityExpression";

export class MysqlQueryBuilder extends RelationalQueryBuilder {
    //#region column type map
    public queryLimit: IQueryLimit = {
        maxParameters: 65535,
        maxQueryLength: 8388608
    };
    public valueTypeMap = new Map<GenericType, (value?: unknown) => ICompleteColumnType<MysqlColumnType>>([
        [Uuid, () => ({ columnType: "binary", option: { size: 16 } })],
        [BigInt, () => ({ columnType: "bigint", group: "BigInt" })],
        [TimeSpan, () => ({ columnType: "time" })],
        [Date, () => ({ columnType: "datetime" })],
        [String, (val: string) => ({ columnType: "varchar", option: { length: 255 + (Math.ceil(Math.max(val.length - 255, 0) / 50) * 50) } })],
        [Number, () => ({ columnType: "decimal", option: { precision: 18, scale: 0 } })],
        [Boolean, () => ({ columnType: "bit" })]
    ]);

    //#endregion
    protected override getInsertQuery<TE extends object>(insertExp: InsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const context = this.createContext(insertExp, parameters, option);

        const colString = Enumerable.from(insertExp.columns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity)}(${colString}) VALUES`;

        const result: IQuery[] = [];
        if (insertExp.values.length === 1) {
            const itemExp = insertExp.values[0];
            const values: string[] = [];
            this.indent++;
            for (const col of insertExp.columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    values.push(this.toString(valueExp, context));
                }
                else {
                    values.push("DEFAULT");
                }
            }
            this.indent--;
            result.push({
                query: `${insertQuery}${this.newLine()}(${values.join(",")})`,
                type: QueryType.DML,
                parameters: this.getParameter(context)
            });

            const selectExp = new SelectExpression(insertExp.entity);
            selectExp.selects = insertExp.returnings.slice(0);
            const entityMeta = (insertExp.entity as EntityExpression<TE>).metaData;
            if (entityMeta?.hasIncrementPrimary) {
                const incrementColumn = insertExp.returnings
                    .find(o => (o.columnMeta as IntegerColumnMetaData<TE>)?.autoIncrement);
                selectExp.addWhere(new StrictEqualExpression(incrementColumn, new RawSqlExpression(incrementColumn.type, "LAST_INSERT_ID()")));
            }
            else {
                let pkFilter = insertExp.entity.primaryColumns.reduce((r, o) => {
                    const valueExp = itemExp[o.propertyName] as SqlParameterExpression;
                    const paramExp = context.parameters.get(valueExp);
                    if (paramExp) {
                        selectExp.paramExps.push(valueExp);
                    }
                    const rel = new StrictEqualExpression(o, valueExp);
                    return r ? new AndExpression(r, rel) : rel;
                }, null as IExpression<boolean>);
                selectExp.addWhere(pkFilter);
            }

            result.push(...this.getSelectQuery(selectExp, option, parameters));
        }
        else {
            let paramValue: IQueryParameterValue<Partial<TE>[]>;
            if (insertExp.returnings.length) {
                paramValue = { value: [] };
            }

            this.indent++;
            const rowValues: string[] = [];
            for (const itemExp of insertExp.values) {
                const values: string[] = [];
                let pkObj: Partial<TE>;
                if (paramValue) {
                    pkObj = {};
                    paramValue.value.push(pkObj);
                }

                for (const col of insertExp.columns) {
                    const valueExp = itemExp[col.propertyName] as SqlParameterExpression | ValueExpression;
                    if (valueExp) {
                        values.push(this.toString(valueExp, context));
                        const paramValue = context.parameters.get(valueExp as SqlParameterExpression);
                        if (pkObj) {
                            pkObj[col.propertyName] = (paramValue ? paramValue.value : (valueExp as ValueExpression).value) as TE[StringKeyOf<TE>];
                        }
                    }
                    else {
                        values.push("DEFAULT");
                    }
                }

                rowValues.push(`(${values.join(",")})`);
            }
            result.push({
                query: `${insertQuery}${this.newLine()}${rowValues.join(`${this.newLine()},`)}`,
                type: QueryType.DML,
                parameters: this.getParameter(context)
            });
            this.indent--;

            if (paramValue) {
                const selectExp = new SelectExpression(insertExp.entity);
                selectExp.selects = insertExp.returnings.slice(0);
                const tvpExp = new SqlTableValueParameterExpression(new ParameterExpression<TE[]>("inserted", Array), {} as any);
                let relation: IExpression<boolean>;
                for (const column of selectExp.entity.primaryColumns) {
                    const newValueColumn = new ColumnExpression(tvpExp, column.type, column.propertyName, column.columnName, false, true, column.columnMeta.columnType);
                    tvpExp.columns.push(newValueColumn);
                    const rel = new StrictEqualExpression(column, newValueColumn);
                    relation = relation ? new AndExpression(relation, rel) : rel;
                }

                selectExp.paramExps.push(tvpExp);
                const valueSelectExp = new SelectExpression(tvpExp);
                valueSelectExp.selects = tvpExp.columns;
                valueSelectExp.isSubSelect = true;
                selectExp.addJoin(valueSelectExp, relation, "INNER");

                const selectParameterMap: ISqlParameterValueMap = new Map([[tvpExp, paramValue]]);
                result.push(...this.getSelectQuery(selectExp, option, selectParameterMap));
            }
        }

        return result;
    }
    protected override getUpdateQuery<TE extends object>(updateExp: UpdateExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        const result: IQuery[] = [];
        const context = this.createContext(updateExp, parameters, option);

        if (updateExp.paging?.skip) {
            const projectedEntity = new ProjectionEntityExpression(updateExp.select);
            projectedEntity.alias = updateExp.entity.alias + "_1";
            const selectExp = new SelectExpression(projectedEntity);

            let relation: IExpression<boolean>;
            for (const column of updateExp.entity.primaryColumns) {
                const selectColumn = projectedEntity.columns.find(o => o.propertyName == column.propertyName);
                const equalExp = new StrictEqualExpression(column, selectColumn);
                relation = relation ? new AndExpression(relation, equalExp) : equalExp;
            }

            const setQuery = selectExp.selects
                .map((o) => `${this.enclose(o.columnName)} = ${this.getColumnQueryString(o, context)}`)
                .join(", ");
            
            const updateQuery = `UPDATE ${this.entityName(updateExp.entity)} AS ${this.enclose(updateExp.entity.alias)}` +
                this.getJoinQueryString([new JoinRelation(updateExp.select, selectExp, relation, "INNER")], context) +
                this.newLine() + `SET ${setQuery}`;
            result.push({
                query: updateQuery,
                parameters: this.getParameter(context),
                type: updateExp.returnings.length ? QueryType.DML | QueryType.DQL : QueryType.DML
            });
        }
        else {
            const setQuery = Object.keys(updateExp.setter).map((o) => {
                const value = updateExp.setter[o as keyof TE];
                const valueStr = this.toOperandString(value, context);
                const column = updateExp.entity.columns.find((c) => c.propertyName === o);
                return `${this.enclose(updateExp.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
            }).join(", ");

            let updateQuery = `UPDATE ${this.entityName(updateExp.entity)} AS ${this.enclose(updateExp.entity.alias)}` +
                this.getJoinQueryString(updateExp.joins, context) +
                this.newLine() + `SET ${setQuery}`;
            if (updateExp.where) {
                updateQuery += this.newLine() + "WHERE " + this.toLogicalString(updateExp.where, context);
            }
            if (updateExp.paging?.take) {
                if (updateExp.orders.length) {
                    updateQuery += this.newLine() + `ORDER BY ${updateExp.orders.map((c) => this.toString(c.column, context) + " " + c.direction).join(", ")}`;
                }

                updateQuery += `${this.newLine()}LIMIT ${this.toString(updateExp.paging.take, context)}`;
            }

            result.push({
                query: updateQuery,
                type: QueryType.DML,
                parameters: this.getParameter(context)
            });
        }

        if (updateExp.returnings.length) {
            const selectExp = new SelectExpression(updateExp.entity);
            selectExp.where = updateExp.select.where;
            selectExp.selects = updateExp.returnings;
            selectExp.paramExps = updateExp.paramExps;
            selectExp.joins = updateExp.joins;
            result.push(...this.getSelectQuery(selectExp, option, parameters));
        }

        return result;
    }
    protected override createTableValueConstructorQuery<TE extends object>(entityExp: SqlTableValueParameterExpression<TE>, values: TE[], param?: IQueryBuilderContext): string {
        const valueLiterals = values.map(o => {
            const valueQueries = entityExp.columns.map(p => {
                return `${this.valueString(o[p.propertyName] as ValueType)} AS ${this.enclose(p.columnName)}`;
            }).join(", ");
            return `SELECT ${valueQueries}`;
        }).join(`${this.newLine(1, false)}UNION ALL${this.newLine(1, false)}`)
        return `(${this.newLine(1)}${valueLiterals}${this.newLine(-1)}) AS ${this.enclose(entityExp.alias)}`;
    }
    protected override createTempTableQuery<TE extends object>(entityExp: SqlTableValueParameterExpression<TE>, values: TE[], param: IQueryBuilderContext): IQuery[] {
        const result: IQuery[] = [];
        result.push({
            query: `DROP TEMPORARY TABLE IF EXISTS ${this.entityName(entityExp)}`,
            type: QueryType.DDL
        });
        const columnDefinition = entityExp.columns.map((c) => {
            const colTypeFactory = this.valueTypeMap.get(c.type);
            const maxValue = Enumerable.from(values).map((o) => (o[c.propertyName] as string)?.length).max();
            const colType = colTypeFactory(maxValue);
            return `${this.enclose(c.columnName)} ${this.columnTypeString(colType)}`;
        }).join("," + this.newLine(1, false));

        const query = `CREATE TEMPORARY TABLE ${this.entityName(entityExp)}` +
            `${this.newLine()}(` +
            `${this.newLine(1, false)}${columnDefinition}` +
            `${this.newLine()})`;

        result.push({
            query,
            type: QueryType.DDL
        });

        const columns = entityExp.columns;
        const insertQuery = new InsertExpression(entityExp, [], columns);
        for (const item of values) {
            const itemExp: { [key: string]: IExpression } = {};
            for (const col of columns) {
                switch (col.propertyName) {
                    case "__value": {
                        itemExp[col.propertyName] = new ValueExpression(item);
                        break;
                    }
                    default: {
                        const propVal = item[col.propertyName];
                        itemExp[col.propertyName] = new ValueExpression(isNotNull(propVal) ? propVal : null);
                        break;
                    }
                }
            }
            insertQuery.values.push(itemExp as SetterObj<TE>);
        }

        result.push(...this.getInsertQuery(insertQuery, param.option, param.parameters));

        return result;
    }
    protected override createContext(queryExp: IQueryExpression, parameters: ISqlParameterValueMap, option: IQueryOption): IMysqlQueryBuilderContext {
        return {
            queryExpression: queryExp,
            parameters: parameters,
            option: option,
            placeholders: []
        };
    }
    protected override getParameter(context: IMysqlQueryBuilderContext) {
        const paramObj = new Map<string, any>();
        for (let i = 0, len = context.placeholders.length; i < len; i++) {
            paramObj.set(`?${i}`, context.placeholders[i]);
        }

        return paramObj;
    }
    protected override toSqlParameterString(expression: SqlParameterExpression, context?: IMysqlQueryBuilderContext): string {
        const paramValue = context.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }

        if (context?.option?.supportTVP == true && expression instanceof SqlTableValueParameterExpression) {
            context.placeholders.push(JSON.stringify(paramValue.value));

            const column = expression.columns.map((col) => {
                const itemType = expression.itemSchema?.[col.propertyName];
                let columnType: string;
                let valueType: GenericType;
                if (typeof itemType !== "function") {
                    valueType = itemType.type;
                    columnType = itemType.columnType;
                }
                else {
                    valueType = itemType;
                }
                if (!columnType) {
                    const colTypeFactory = this.valueTypeMap.get(valueType);
                    const colType = colTypeFactory();
                    columnType = this.columnTypeString(colType);
                }
                return `${this.enclose(col.columnName)} ${columnType} PATH '$.${col.propertyName}'`;
            }).join(`,${this.newLine(1, false)}`);
            return `JSON_TABLE(?, '$[*]', COLUMNS (${this.newLine(1)}${column}${this.newLine(-1)})) AS ${this.enclose(expression.alias)}`;
        }

        context.placeholders.push(paramValue.value);
        return "?";
    }
}
