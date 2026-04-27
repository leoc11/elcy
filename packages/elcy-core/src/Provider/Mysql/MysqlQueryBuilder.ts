import { Enumerable } from "@elcy/enumerable";
import { QueryType } from "src/Common/Enum";
import { IQuery } from "src/Query/IQuery";
import { IQueryBuilderContext } from "src/Query/IQueryBuilderContext";
import { IQueryOption } from "src/Query/IQueryOption";
import { IQueryParameterValue, ISqlParameterValueMap } from "src/Query/IQueryParameter";
import { InsertExpression } from "src/Queryable/QueryExpression/InsertExpression";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { GenericType, SetterObj, StringKeyOf, ValueType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { EntityExpression } from "src/Queryable/QueryExpression/EntityExpression";
import { IntegerColumnMetaData } from "src/MetaData/IntegerColumnMetaData";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { RawSqlExpression } from "src/Queryable/QueryExpression/RawSqlExpression";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";
import { ParameterExpression } from "src/ExpressionBuilder/Expression/ParameterExpression";
import { isNotNull, isNull } from "src/Helper/Util";
import { SqlTableValueParameterExpression } from "src/Queryable/QueryExpression/SqlTableValueParameterExpression";
import { ColumnExpression } from "src/Queryable/QueryExpression/ColumnExpression";
import { IMysqlQueryBuilderContext } from "./IMysqlQueryBuilderContext";
import { IQueryExpression } from "src/Queryable/QueryExpression/IQueryExpression";
import { UpdateExpression } from "src/Queryable/QueryExpression/UpdateExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { ProjectionEntityExpression } from "src/Queryable/QueryExpression/ProjectionEntityExpression";
import { DeleteExpression } from "src/Queryable/QueryExpression/DeleteExpression";
import { UpsertExpression } from "src/Queryable/QueryExpression/UpsertExpression";
import { Null } from "src/Common/Constant";
import { mysqlQueryTranslator } from "./MysqlQueryTranslator";

export class MysqlQueryBuilder extends RelationalQueryBuilder {
    //#region column type map
    public queryLimit: IQueryLimit = {
        maxParameters: 65535,
        maxQueryLength: 8388608
    };
    public override translator = mysqlQueryTranslator;

    override encloseIdentifier(identity: string): string {
        return "`" + identity + "`";
    }
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
                        if (pkObj && col.isPrimary) {
                            pkObj[col.propertyName] = this.extractValue(valueExp, context) as TE[StringKeyOf<TE>];
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

            if (insertExp.returnings.length && paramValue) {
                const selectExp = new SelectExpression(insertExp.entity);
                selectExp.selects = insertExp.returnings.slice(0);
                const tvpExp = new SqlTableValueParameterExpression(new ParameterExpression<TE[]>("inserted", Array), {} as any);
                const relation = new AndExpression();
                for (const column of selectExp.entity.primaryColumns) {
                    const newValueColumn = new ColumnExpression(tvpExp, column.type, column.propertyName, column.columnName, false, true, column.columnMeta.columnType);
                    tvpExp.columns.push(newValueColumn);
                    const rel = new StrictEqualExpression(column, newValueColumn);
                    relation.operands.push(rel);
                }

                selectExp.paramExps.push(tvpExp);
                const valueSelectExp = new SelectExpression(tvpExp);
                valueSelectExp.selects = tvpExp.columns;
                valueSelectExp.isSubSelect = true;
                selectExp.addJoin(valueSelectExp, relation.asOperand(), "INNER");

                const selectParameterMap: ISqlParameterValueMap = new Map([[tvpExp, paramValue]]);
                result.push(...this.getSelectQuery(selectExp, option, selectParameterMap));
            }
        }

        return result;
    }
    protected override getUpdateQuery<TE extends object>(updateExp: UpdateExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        const result: IQuery[] = [];
        const context = this.createContext(updateExp, parameters, option);

        const useTempTable = !option?.supportTVP && !updateExp.parentRelation && updateExp.includes.length;
        if (useTempTable) {
            for (const [key, valueExp] of parameters) {
                if (!(key instanceof SqlTableValueParameterExpression)) {
                    continue;
                }

                key.asTempTable = true;
                result.push(...this.getTempTableQuery(key, valueExp.value as unknown[], context));
            }
        }

        if (updateExp.paging?.skip) {
            const projectedEntity = new ProjectionEntityExpression(updateExp.select);
            projectedEntity.alias = updateExp.entity.alias + "_1";
            const selectExp = new SelectExpression(projectedEntity);

            const relation = new AndExpression();
            for (const column of updateExp.entity.primaryColumns) {
                const selectColumn = projectedEntity.columns.find(o => o.propertyName == column.propertyName);
                const equalExp = new StrictEqualExpression(column, selectColumn);
                relation.operands.push(equalExp);
            }

            const setQuery = Object.keys(updateExp.setter).map((o) => {
                const value = updateExp.setter[o as keyof TE];
                const valueStr = this.toOperandString(value, context);
                const column = updateExp.entity.columns.find((c) => c.propertyName === o);
                return `${this.enclose(updateExp.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
            }).join(`,${this.newLine(1, false)}`);

            const updateQuery = `UPDATE ${this.entityName(updateExp.entity)} AS ${this.enclose(updateExp.entity.alias)}` +
                this.getJoinQueryString([new JoinRelation(updateExp.select, selectExp, relation.asOperand(), "INNER")], context) +
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
            }).join(`,${this.newLine(1, false)}`);

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

        const includedUpdates = updateExp.includes.flatMap((o) => this.getUpdateQuery(o.child, context.option, context.parameters));
        result.push(...includedUpdates);
        return result;
    }
    protected override getDeleteQuery<T extends object>(deleteExp: DeleteExpression<T>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        let result: IQuery[] = [];
        const context = this.createContext(deleteExp, parameters, option);

        const useTempTable = !option?.supportTVP && !deleteExp.parentRelation && deleteExp.includes.length;
        if (useTempTable) {
            for (const [key, valueExp] of parameters) {
                if (!(key instanceof SqlTableValueParameterExpression)) {
                    continue;
                }

                key.asTempTable = true;
                result.push(...this.getTempTableQuery(key, valueExp.value as unknown[], context));
            }
        }

        let selectQuery = `DELETE ${this.enclose(deleteExp.entity.alias ?? deleteExp.entity.name)}` +
            this.newLine() + `FROM ${this.entityName(deleteExp.entity)}${(deleteExp.entity.alias ? " AS " + this.enclose(deleteExp.entity.alias) : "")}` +
            this.getJoinQueryString(deleteExp.joins, context) + this.getParentJoinQueryString(deleteExp.parentRelation, context);
        if (deleteExp.where) {
            selectQuery += this.newLine() + "WHERE " + this.toLogicalString(deleteExp.where, context);
        }
        result.push({
            query: selectQuery,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        });

        const includedDeletes = deleteExp.includes.flatMap((o) => this.getDeleteQuery(o.child, context.option, context.parameters));
        result.push(...includedDeletes);
        return result;
    }
    protected override getUpsertQuery<TE extends object>(upsertExp: UpsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        if (upsertExp.values.length <= 0) {
            return [];
        }

        const context = this.createContext(upsertExp, parameters, option);
        const colString = Enumerable.from(upsertExp.insertColumns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT INTO ${this.entityName(upsertExp.entity)}(${colString}) VALUES`;
        let returning = "";
        if (upsertExp.returnings.length) {
            returning = `${this.newLine()}RETURNING ${upsertExp.returnings.map(o => {
                let colStr = this.getColumnQueryString(o, context);
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            }).join(",")}`;
        }

        let paramValue: IQueryParameterValue<Partial<TE>[]>;
        if (upsertExp.returnings.length) {
            paramValue = { value: [] };
        }

        let rowValues: string[] = [];
        // bulk insert
        for (const itemExp of upsertExp.values) {
            const values: string[] = [];
            let pkObj: Partial<TE>;
            if (paramValue) {
                pkObj = {};
                paramValue.value.push(pkObj);
            }

            for (const col of upsertExp.insertColumns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    const paramExp = parameters.get(valueExp);
                    if (paramExp) {
                        context.parameters.set(valueExp, paramExp);
                        if (pkObj && col.isPrimary) {
                            pkObj[col.propertyName] = this.extractValue(valueExp, context) as TE[StringKeyOf<TE>];
                        }
                    }
                    values.push(this.toString(valueExp, context));
                }
                else {
                    values.push("DEFAULT");
                }
            }

            rowValues.push(`(${values.join(",")})`);
        }

        const valueAlias = upsertExp.entity.alias ?? "EXCLUDED";
        const setQuery = Object.keys(upsertExp.setter).map((prop: StringKeyOf<TE>) => {
            const column = upsertExp.entity.columns.find((c) => c.propertyName === prop);
            const valExp = upsertExp.setter[prop];
            const valQuery = isNull(valExp) ? `${this.enclose(valueAlias)}.${this.enclose(column.columnName)}` : this.toOperandString(valExp, context);
            return `${this.enclose(column.columnName)} = ${valQuery}`;
        }).join(`,${this.newLine(1, false)}`);
        let update = `ON DUPLICATE KEY UPDATE` +
            this.newLine(1, false) + `${setQuery}`;
        const result: IQuery[] = [{
            query: `${insertQuery}${this.newLine(1, false)}${rowValues.join(`,${this.newLine(1, false)}`)} AS ${this.enclose(valueAlias)}${update}${returning}`,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        }];

        if (upsertExp.returnings.length && paramValue) {
            const selectExp = new SelectExpression(upsertExp.entity);
            selectExp.selects = upsertExp.returnings.slice(0);
            const tvpExp = new SqlTableValueParameterExpression(new ParameterExpression<TE[]>("inserted", Array), {} as any);
            const relation = new AndExpression();
            for (const column of selectExp.entity.primaryColumns) {
                const newValueColumn = new ColumnExpression(tvpExp, column.type, column.propertyName, column.columnName, false, true, column.columnMeta.columnType);
                tvpExp.columns.push(newValueColumn);
                const rel = new StrictEqualExpression(column, newValueColumn);
                relation.operands.push(rel);
            }

            selectExp.paramExps.push(tvpExp);
            const valueSelectExp = new SelectExpression(tvpExp);
            valueSelectExp.selects = tvpExp.columns;
            valueSelectExp.isSubSelect = true;
            selectExp.addJoin(valueSelectExp, relation.asOperand(), "INNER");

            const selectParameterMap: ISqlParameterValueMap = new Map([[tvpExp, paramValue]]);
            result.push(...this.getSelectQuery(selectExp, option, selectParameterMap));
        }

        return result;
    }
    protected override toTableValueConstructorQuery<TE extends object>(entityExp: SqlTableValueParameterExpression<TE>, values: TE[], context?: IQueryBuilderContext): string {
        const valueLiterals = values.map(o => {
            const valueQueries = entityExp.columns.map(p => {
                return `${this.valueString(o[p.propertyName] as ValueType)} AS ${this.enclose(p.columnName)}`;
            }).join(", ");
            return `SELECT ${valueQueries}`;
        }).join(`${this.newLine(1, false)}UNION ALL${this.newLine(1, false)}`)
        return `(${this.newLine(1)}${valueLiterals}${this.newLine(-1)}) AS ${this.enclose(entityExp.alias)}`;
    }
    protected override getTempTableQuery<TE extends object>(tvpExp: SqlTableValueParameterExpression<TE>, values: TE[], context: IQueryBuilderContext): IQuery[] {
        const result: IQuery[] = [];
        result.push({
            query: `DROP TEMPORARY TABLE IF EXISTS ${this.entityName(tvpExp)}`,
            type: QueryType.DDL
        });
        const columnDefinition = tvpExp.columns.map((c) => {
            const colTypeConfig = this.translator.resolveValueType(c.type) ?? this.translator.resolveValueType(Null);
            return `${this.enclose(c.columnName)} ${this.columnTypeString(colTypeConfig.columnType)}`;
        }).join("," + this.newLine(1, false));

        const query = `CREATE TEMPORARY TABLE ${this.entityName(tvpExp)}` +
            `${this.newLine()}(` +
            `${this.newLine(1, false)}${columnDefinition}` +
            `${this.newLine()})`;

        result.push({
            query,
            type: QueryType.DDL
        });

        const columns = tvpExp.columns;
        const insertQuery = new InsertExpression(tvpExp, [], columns);
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

        result.push(...this.getInsertQuery(insertQuery, context.option, context.parameters));

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
                let valueType: GenericType<ValueType>;
                if (typeof itemType !== "function") {
                    valueType = itemType.type;
                    columnType = itemType.columnType;
                }
                else {
                    valueType = itemType;
                }
                if (!columnType) {
                    const colTypeConfig = this.translator.resolveValueType(valueType) ?? this.translator.resolveValueType(Null);
                    columnType = this.columnTypeString(colTypeConfig.columnType);
                }
                return `${this.enclose(col.columnName)} ${columnType} PATH '$.${col.propertyName}'`;
            }).join(`,${this.newLine(1, false)}`);
            return `JSON_TABLE(?, '$[*]', COLUMNS (${this.newLine(1)}${column}${this.newLine(-1)})) AS ${this.enclose(expression.alias)}`;
        }

        context.placeholders.push(paramValue.value);
        return "?";
    }
}
