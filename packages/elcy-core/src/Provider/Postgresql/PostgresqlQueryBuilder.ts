import { Enumerable, IEnumerable } from "@elcy/enumerable";
import { IQuery } from "src/Query/IQuery";
import { GenericType, StringKeyOf, ValueType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { IQueryBuilderContext } from "src/Query/IQueryBuilderContext";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { QueryType } from "src/Common/Enum";
import { IQueryOption } from "src/Query/IQueryOption";
import { ISqlParameterValueMap } from "src/Query/IQueryParameter";
import { UpdateExpression } from "src/Queryable/QueryExpression/UpdateExpression";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { DeleteExpression } from "src/Queryable/QueryExpression/DeleteExpression";
import { postgresqlQueryTranslator } from "./PostgresqlQueryTranslator";
import { IEntityExpression } from "src/Queryable/QueryExpression/IEntityExpression";
import { SqlTableValueParameterExpression } from "src/Queryable/QueryExpression/SqlTableValueParameterExpression";
import { BatchedQuery } from "src/Query/BatchedQuery";
import { ProjectionEntityExpression } from "src/Queryable/QueryExpression/ProjectionEntityExpression";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";
import { UpsertExpression } from "src/Queryable/QueryExpression/UpsertExpression";
import { Null } from "src/Common/Constant";
import { isNull } from "src/Helper/Util";

export class PostgresqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 34464
    };
    public override translator = postgresqlQueryTranslator;
    public override enclose(identity: string) {
        let requireEscape = this.namingStrategy.enableEscape;
        if (!requireEscape) {
            requireEscape = identity.search(/[A-Z ]/) !== -1;
        }
        if (requireEscape) {
            return this.encloseIdentifier(identity);
        }
        else {
            return identity;
        }
    }

    public override mergeQueries(queries: IEnumerable<IQuery>): IQuery[] {
        // merge all, pipeline must use driver
        if (!queries.slice(1, 2).some(() => true)) {
            return Enumerable.from(queries).toArray();
        }

        const query = new BatchedQuery();
        query.add(...queries);
        return [query];
    }
    protected override getParameter(context: IQueryBuilderContext) {
        const paramObj = new Map<string, any>();
        let qparams = this.getQueryParameters(context);
        if (!context.option?.supportTVP) {
            qparams = qparams.filter(o => !(o instanceof SqlTableValueParameterExpression));
        }
        let i = 0;
        for (const [k, p] of context.parameters) {
            if (!qparams.includes(k)) {
                continue;
            }
            if (k instanceof SqlTableValueParameterExpression) {
                for (const propertyKey in k.properties) {
                    paramObj.set(`$${++i}`, (p.value as Record<string, unknown>[]).map(o => o[propertyKey]));
                }
            }
            else {
                paramObj.set(`$${++i}`, p.value);
            }
        }

        return paramObj;
    }
    protected override toSqlParameterString(expression: SqlParameterExpression, context: IQueryBuilderContext): string {
        const paramValue = context.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }

        let qparams = this.getQueryParameters(context);
        if (!context.option?.supportTVP) {
            qparams = qparams.filter(o => !(o instanceof SqlTableValueParameterExpression));
        }
        const indexMap = Enumerable.from(context.parameters)
            .filter(o => qparams.includes(o[0]))
            .flatMap(o => {
                if (o[0] instanceof SqlTableValueParameterExpression) {
                    return Object.keys(o[0].properties).map(_ => o[1].name);
                }
                return [o[1].name];
            })
            .toArray();
        const index = indexMap.indexOf(paramValue.name) + 1;
        if (index && expression instanceof SqlTableValueParameterExpression) {
            return `UNNEST(${Object.values(expression.properties).map((col, i) => {
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
                return `$${index + i}::${columnType}[]`
            }).join(",")}) AS ${this.enclose(expression.alias)}(${Object.values(expression.properties).map(o => o.columnName).join(", ")})`;
        }
        return `$${index}`;
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

            const setQuery = Object.keys(updateExp.setter).map((o: StringKeyOf<TE>) => {
                const value = updateExp.setter[o];
                const valueStr = this.toOperandString(value, context);
                const column = updateExp.entity.properties[o];
                return `${this.enclose(column.columnName)} = ${valueStr}`;
            }).join(`,${this.newLine(1, false)}`);

            const entityString = this.isSimpleSelect(selectExp) ? this.getEntityQueryString(selectExp.entity, context) : `(${this.newLine(1)}${this.toSelectString(selectExp, context)}${this.newLine(-1)}) AS ${this.enclose(selectExp.entity.alias ?? selectExp.entity.name)}`;
            let updateQuery = `UPDATE ${this.entityName(updateExp.entity)}${(updateExp.entity.alias ? " AS " + this.enclose(updateExp.entity.alias) : "")}` +
                this.newLine() + `SET ${setQuery}` +
                this.newLine() + `FROM ${entityString}`;

            const relation = new AndExpression();
            for (const column of updateExp.entity.primaryColumns) {
                const selectColumn = projectedEntity.properties[column.propertyName];
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
            const setQuery = Object.keys(updateExp.setter).map((o: StringKeyOf<TE>) => {
                const value = updateExp.setter[o];
                const valueStr = this.toOperandString(value, context);
                const column = updateExp.entity.properties[o];
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
    protected override getDeleteQuery<TE extends object>(deleteExp: DeleteExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
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

        if (deleteExp.paging?.take) {
            deleteExp.select.selects = [];
            const projectedEntity = new ProjectionEntityExpression(deleteExp.select);
            projectedEntity.alias = deleteExp.entity.alias + "_1";
            const selectExp = new SelectExpression(projectedEntity);
            selectExp.parentRelation = deleteExp.parentRelation as any;

            const entityString = this.isSimpleSelect(selectExp) ? this.getEntityQueryString(selectExp.entity, context) : `(${this.newLine(1)}${this.toSelectString(selectExp, context)}${this.newLine(-1)}) AS ${this.enclose(selectExp.entity.alias ?? selectExp.entity.name)}`;
            let deleteQuery = `DELETE FROM ${this.entityName(deleteExp.entity)}${(deleteExp.entity.alias ? " AS " + this.enclose(deleteExp.entity.alias) : "")}` +
                this.newLine() + `USING ${entityString}`;

            const relation = new AndExpression();
            for (const column of deleteExp.entity.primaryColumns) {
                const selectColumn = projectedEntity.properties[column.propertyName];
                const equalExp = new StrictEqualExpression(column, selectColumn);
                relation.operands.push(equalExp);
            }
            deleteQuery += `${this.newLine()}WHERE ${this.toLogicalString(relation.asOperand(), context)}`;

            result.push({
                query: deleteQuery,
                type: QueryType.DML,
                parameters: this.getParameter(context)
            });
        }
        else {
            let firstJoin: JoinRelation<TE> = null;
            const whereQueries: string[] = [];
            let joins = deleteExp.joins.slice();
            if (joins.length) {
                firstJoin = joins.shift();
            }
            let deleteQuery = `DELETE FROM ${this.entityName(deleteExp.entity)}${(deleteExp.entity.alias ? " AS " + this.enclose(deleteExp.entity.alias) : "")}`;
            if (firstJoin) {
                whereQueries.push(this.toLogicalString(firstJoin.relation, context));
                const entityString = this.isSimpleSelect(firstJoin.child) ? this.getEntityQueryString(firstJoin.child.entity, context) : `(${this.newLine(1)}${this.toSelectString(firstJoin.child, context)}${this.newLine(-1)}) AS ${this.enclose(firstJoin.child.entity.alias ?? firstJoin.child.entity.name)}`;
                deleteQuery += this.newLine() + `USING ${entityString}` +
                    this.getJoinQueryString(joins, context) + this.getParentJoinQueryString(deleteExp.parentRelation, context);
            }
            if (!firstJoin && deleteExp.parentRelation) {
                const parent = deleteExp.parentRelation.parent;
                whereQueries.push(this.toLogicalString(deleteExp.parentRelation.relation, context));
                const entityString = this.isSimpleSelect(parent.select) ? this.getEntityQueryString(parent.entity, context) : `(${this.newLine(1)}${this.toSelectString(parent.select, context)}${this.newLine(-1)}) AS ${this.enclose(parent.entity.alias ?? parent.entity.name)}`;
                deleteQuery += this.newLine() + `USING ${entityString}`;
            }
            if (deleteExp.where) {
                whereQueries.push(this.toLogicalString(deleteExp.where, context));
            }
            if (whereQueries.length) {
                deleteQuery += this.newLine() + "WHERE " + whereQueries.join(" AND ");
            }

            result.push({
                query: deleteQuery,
                type: QueryType.DML,
                parameters: this.getParameter(context)
            });
        }

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
            const column = upsertExp.entity.properties[prop];
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
    protected override entityName<T extends object>(entityExp: IEntityExpression<T>): string {
        if (entityExp instanceof SqlTableValueParameterExpression) {
            return `pg_temp.${this.enclose(entityExp.name)}`;
        }

        return super.entityName(entityExp);
    }
}
