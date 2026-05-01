import { Enumerable, isNull } from "@elcy/enumerable";
import { QueryType } from "../../Common/Enum";
import { StringKeyOf, ValueType } from "../../Common/Type";
import { Version } from "../../Common/Version";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilderContext } from "../../Query/IQueryBuilderContext";
import { IQueryOption } from "../../Query/IQueryOption";
import { ISqlParameterValueMap } from "../../Query/IQueryParameter";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { sqliteQueryTranslator } from "./SqliteQueryTranslator";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { IEntityExpression } from "src/Queryable/QueryExpression/IEntityExpression";
import { SqlTableValueParameterExpression } from "src/Queryable/QueryExpression/SqlTableValueParameterExpression";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { UpdateExpression } from "src/Queryable/QueryExpression/UpdateExpression";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { ProjectionEntityExpression } from "src/Queryable/QueryExpression/ProjectionEntityExpression";

export class SqliteQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxBatchQuery: 1,
        maxParameters: 999,
        maxQueryLength: 1000000
    };
    public override translator = sqliteQueryTranslator;
    protected override getPagingQueryString(select: SelectExpression, context?: IQueryBuilderContext): string {
        let result = "";
        if (select.paging.take) {
            result += `${this.newLine()}LIMIT ${this.toString(select.paging.take, context)}`;
        }
        if (select.paging.skip) {
            result += `${this.newLine()}OFFSET ${this.toString(select.paging.skip, context)}`;
        }
        return result;
    }
    protected override entityName<T extends object>(entityExp: IEntityExpression<T>): string {
        if (entityExp instanceof SqlTableValueParameterExpression) {
            return `temp.${this.enclose(entityExp.name)}`;
        }

        return super.entityName(entityExp);
    }
    protected override toTableValueConstructorQuery<TE extends object>(entityExp: SqlTableValueParameterExpression<TE>, values: TE[], context?: IQueryBuilderContext): string {
        const columns = entityExp.columns.map((o, i) => `column${i + 1} AS ${this.enclose(o.columnName)}`).join(", ");
        let i = 0;
        const valueLiterals = values.map(o => {
            const valueQuery = entityExp.columns.map(p => {
                const value = p.propertyName === "__index" ? i++ : o[p.propertyName];
                return this.valueString(value as ValueType);
            }).join(", ");
            return `(${valueQuery})`;
        }).join(`,${this.newLine(2, false)}`)
        return `(${this.newLine(1)}SELECT${this.newLine(1)}${columns}${this.newLine(-1)}FROM (${this.newLine(1)}VALUES${this.newLine()}${valueLiterals}${this.newLine(-1)})${this.newLine(-1)}) AS ${this.enclose(entityExp.alias)}`;
    }
    protected override toSqlParameterString(expression: SqlParameterExpression, context?: IQueryBuilderContext): string {
        const paramValue = context.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }
        if (context?.option?.supportTVP == true && expression instanceof SqlTableValueParameterExpression) {
            this.indent++;
            const column = expression.columns
                .map((col) => `JSON_EXTRACT(value, '$.${col.propertyName}') AS ${this.enclose(col.columnName)}`)
                .join(`,${this.newLine(1, false)}`);
            const result = `(${this.newLine()}SELECT ${column}${this.newLine()}FROM JSON_EACH(:${paramValue.name})${this.newLine()}) AS ${this.enclose(expression.alias)}`;
            this.indent--;
            return result;
        }

        return `:${paramValue.name}`;
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

        if (updateExp.paging?.take) {
            const projectedEntity = new ProjectionEntityExpression(updateExp.select);
            projectedEntity.alias = updateExp.entity.alias + "_1";
            const selectExp = new SelectExpression(projectedEntity);
            selectExp.selects = [];
            selectExp.parentRelation = updateExp.parentRelation as any;

            const setQuery = Object.keys(updateExp.setter).map((o) => {
                const value = updateExp.setter[o as keyof TE];
                const valueStr = this.toOperandString(value, context);
                const column = updateExp.entity.columns.find((c) => c.propertyName === o);
                return `${this.enclose(column.columnName)} = ${valueStr}`;
            }).join(`,${this.newLine(1, false)}`);

            const entityString = this.isSimpleSelect(selectExp) ? this.getEntityQueryString(selectExp.entity, context) : `(${this.newLine(1)}${this.toSelectString(selectExp, context)}${this.newLine(-1)}) AS ${this.enclose(selectExp.entity.alias ?? selectExp.entity.name)}`;
            let updateQuery = `UPDATE ${this.entityName(updateExp.entity)}${(updateExp.entity.alias ? " AS " + this.enclose(updateExp.entity.alias) : "")}` +
                this.newLine() + `SET ${setQuery}` +
                this.newLine() + `FROM ${entityString}`;

            const relation = new AndExpression();
            for (const column of updateExp.entity.primaryColumns) {
                const selectColumn = projectedEntity.columns.find(o => o.propertyName == column.propertyName);
                const equalExp = new StrictEqualExpression(column, selectColumn);
                relation.operands.push(equalExp);
            }
            updateQuery += `${this.newLine()}WHERE ${this.toLogicalString(relation.asOperand(), context)}`;
            if (updateExp.returnings.length) {
                updateQuery += `${this.newLine()}RETURNING ${updateExp.returnings.map(o => {
                    let colStr = this.getColumnQueryString(o, context);
                    // NOTE: computed column should always has alias
                    if (o.alias) {
                        colStr += " AS " + this.enclose(o.alias);
                    }

                    return colStr;
                }).join(",")}`;
            }

            result.push({
                query: updateQuery,
                type: updateExp.returnings.length ? QueryType.DML | QueryType.DQL : QueryType.DML,
                parameters: this.getParameter(context)
            });
        }
        else {
            const setQuery = Object.keys(updateExp.setter).map((o) => {
                const value = updateExp.setter[o as keyof TE];
                const valueStr = this.toOperandString(value, context);
                const column = updateExp.entity.columns.find((c) => c.propertyName === o);
                return `${this.enclose(column.columnName)} = ${valueStr}`;
            }).join(`,${this.newLine(1, false)}`);

            let firstJoin: JoinRelation<TE> = null;
            const whereQueries: string[] = [];
            let joins = updateExp.joins.slice();
            if (joins.length) {
                firstJoin = joins.shift();
            }
            let updateQuery = `UPDATE ${this.entityName(updateExp.entity)}${(updateExp.entity.alias ? " AS " + this.enclose(updateExp.entity.alias) : "")}` +
                this.newLine() + `SET ${setQuery}`;

            if (firstJoin) {
                whereQueries.push(this.toLogicalString(firstJoin.relation, context));
                const entityString = this.isSimpleSelect(firstJoin.child) ? this.getEntityQueryString(firstJoin.child.entity, context) : `(${this.newLine(1)}${this.toSelectString(firstJoin.child, context)}${this.newLine(-1)}) AS ${this.enclose(firstJoin.child.entity.alias ?? firstJoin.child.entity.name)}`;
                updateQuery += this.newLine() + `FROM ${entityString}` +
                    this.getJoinQueryString(joins, context) + this.getParentJoinQueryString(updateExp.parentRelation, context);
            }
            if (!firstJoin && updateExp.parentRelation) {
                const parent = updateExp.parentRelation.parent;
                whereQueries.push(this.toLogicalString(updateExp.parentRelation.relation, context));
                const entityString = this.isSimpleSelect(parent.select) ? this.getEntityQueryString(parent.entity, context) : `(${this.newLine(1)}${this.toSelectString(parent.select, context)}${this.newLine(-1)}) AS ${this.enclose(parent.entity.alias ?? parent.entity.name)}`;
                updateQuery += this.newLine() + `FROM ${entityString}`;
            }
            if (updateExp.where) {
                whereQueries.push(this.toLogicalString(updateExp.where, context));
            }
            if (whereQueries.length) {
                updateQuery += this.newLine() + "WHERE " + whereQueries.join(" AND ");
            }
            if (updateExp.returnings.length) {
                updateQuery += `${this.newLine()}RETURNING ${updateExp.returnings.map(o => {
                    let colStr = this.getColumnQueryString(o, context);
                    // NOTE: computed column should always has alias
                    if (o.alias) {
                        colStr += " AS " + this.enclose(o.alias);
                    }

                    return colStr;
                }).join(",")}`;
            }

            result.push({
                query: updateQuery,
                type: updateExp.returnings.length ? QueryType.DML | QueryType.DQL : QueryType.DML,
                parameters: this.getParameter(context)
            });
        }

        const includedUpdates = updateExp.includes.flatMap((o) => this.getUpdateQuery(o.child, context.option, context.parameters));
        result.push(...includedUpdates);
        return result;
    }
    protected override getUpsertQuery<TE extends object>(upsertExp: UpsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        if (upsertExp.values.length <= 0) {
            return [];
        }

        if (option?.version && option.version < new Version(3, 24)) {
            return this.getUpsertQueryV2(upsertExp, option, parameters);
        }

        const context = this.createContext(upsertExp, parameters, option);
        const colString = Enumerable.from(upsertExp.insertColumns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT INTO ${this.entityName(upsertExp.entity)}${upsertExp.entity.alias ? ` AS ${this.enclose(upsertExp.entity.alias)}` : ""}(${colString}) VALUES`;
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

        let rowValues: string[] = [];
        // bulk insert
        for (const itemExp of upsertExp.values) {
            const values: string[] = [];
            for (const col of upsertExp.insertColumns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    const paramExp = parameters.get(valueExp);
                    if (paramExp) {
                        context.parameters.set(valueExp, paramExp);
                    }
                    values.push(this.toString(valueExp, context));
                }
                else {
                    values.push("DEFAULT");
                }
            }

            rowValues.push(`(${values.join(",")})`);
        }

        const pkString = upsertExp.entity.primaryColumns.map(o => o.columnName).join(", ");
        const setQuery = Object.keys(upsertExp.setter).map((prop: StringKeyOf<TE>) => {
            const column = upsertExp.entity.columns.find((c) => c.propertyName === prop);
            const valExp = upsertExp.setter[prop];
            const valQuery = isNull(valExp) ? `EXCLUDED.${this.enclose(column.columnName)}` : this.toOperandString(valExp, context);
            return `${this.enclose(column.columnName)} = ${valQuery}`;
        }).join(`,${this.newLine(1, false)}`);
        let update = `ON CONFLICT (${pkString}) DO UPDATE` +
            this.newLine() + `SET ${setQuery}`;
        const result: IQuery[] = [{
            query: `${insertQuery}${this.newLine(1, false)}${rowValues.join(`,${this.newLine(1, false)}`)}${update}${returning}`,
            type: returning ? QueryType.DML | QueryType.DQL : QueryType.DML,
            parameters: this.getParameter(context)
        }];

        return result;
    }
    protected getUpsertQueryV2<TE extends object>(upsertExp: UpsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        const context = this.createContext(upsertExp, parameters, option);
        const colString = Enumerable.from(upsertExp.insertColumns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT OR IGNORE INTO ${this.entityName(upsertExp.entity)}${upsertExp.entity.alias ? ` AS ${this.enclose(upsertExp.entity.alias)}` : ""}(${colString})${this.newLine()}VALUES`;
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

        const result: IQuery[] = [];
        // bulk insert
        for (const itemExp of upsertExp.values) {
            const context = this.createContext(upsertExp, parameters, option);
            const values: string[] = [];
            for (const col of upsertExp.insertColumns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    const paramExp = parameters.get(valueExp);
                    if (paramExp) {
                        context.parameters.set(valueExp, paramExp);
                    }
                    values.push(this.toString(valueExp, context));
                }
                else {
                    values.push("DEFAULT");
                }
            }

            // insert
            const queryParameters = this.getParameter(context);
            result.push({
                query: `${insertQuery} (${values.join(",")})${returning}`,
                type: QueryType.DML,
                parameters: queryParameters
            });

            const setQuery = Object.keys(upsertExp.setter).map((prop: StringKeyOf<TE>) => {
                const column = upsertExp.entity.columns.find((c) => c.propertyName === prop);
                const valExp = upsertExp.setter[prop] ?? itemExp[prop];
                if (!valExp) {
                    return null;
                }

                return `${this.enclose(column.columnName)} = ${this.toOperandString(valExp, context)}`;
            }).filter((o) => !!o).join(`,${this.newLine(1, false)}`);
            const pkFilter = Enumerable.from(upsertExp.entity.primaryColumns).map((column) => {
                const valueExp = itemExp[column.propertyName];
                return `${this.enclose(column.columnName)}=${this.toOperandString(valueExp, context)}`;
            }).filter((o) => !!o).join(` AND `);

            // update
            result.push({
                query: `UPDATE ${this.entityName(upsertExp.entity)}${upsertExp.entity.alias ? ` AS ${this.enclose(upsertExp.entity.alias)}` : ""}` +
                    this.newLine() + `SET ${setQuery}` +
                    this.newLine() + `WHERE ${pkFilter}${returning}`,
                type: returning ? QueryType.DML & QueryType.DQL : QueryType.DML,
                parameters: queryParameters,
            });
        }

        return result;
    }
}
