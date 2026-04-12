import { Enumerable, IEnumerable } from "@elcy/enumerable";
import { IQuery } from "src/Query/IQuery";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { IQueryBuilderContext } from "src/Query/IQueryBuilderContext";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { QueryType } from "src/Common/Enum";
import { IQueryOption } from "src/Query/IQueryOption";
import { ISqlParameterValueMap } from "src/Query/IQueryParameter";
import { UpdateExpression } from "src/Queryable/QueryExpression/UpdateExpression";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { DeleteExpression } from "src/Queryable/QueryExpression/DeleteExpression";
import { postgresqlQueryTranslator } from "./PostgresqlQueryTranslator";
import { IEntityExpression } from "src/Queryable/QueryExpression/IEntityExpression";
import { SqlTableValueParameterExpression } from "src/Queryable/QueryExpression/SqlTableValueParameterExpression";
import { BatchedQuery } from "src/Query/BatchedQuery";
import { ProjectionEntityExpression } from "src/Queryable/QueryExpression/ProjectionEntityExpression";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";

export class PostgresqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 34464
    };
    public override translator = postgresqlQueryTranslator;
    public valueTypeMap = new Map<GenericType, (value?: unknown) => ICompleteColumnType>([
        [Uuid, () => ({ columnType: "uuid", group: "Identifier" })],
        [BigInt, () => ({ columnType: "bigint", group: "BigInt" })],
        [TimeSpan, () => ({ columnType: "time", group: "Time" })],
        [Date, () => ({ columnType: "datetime", group: "DateTime" })],
        [String, (val: string) => ({ columnType: "nvarchar", group: "String", option: { length: Math.ceil(val.length / 50) * 50 } })],
        [Number, () => ({ columnType: "decimal", group: "Decimal" })],
        [Boolean, () => ({ columnType: "bit", group: "Boolean" })]
    ]);

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
    protected override getParameter(param: IQueryBuilderContext) {
        const paramObj = new Map<string, any>();
        let qparams = this.getQueryParameters(param);
        if (!param.option?.supportTVP) {
            qparams = qparams.filter(o => !(o instanceof SqlTableValueParameterExpression));
        }
        let i = 0;
        for (const [k, p] of param.parameters) {
            if (!qparams.includes(k)) {
                continue;
            }
            if (k instanceof SqlTableValueParameterExpression) {
                for (const column of k.columns) {
                    paramObj.set(`$${++i}`, (p.value as Record<string, unknown>[]).map(o => o[column.propertyName]));
                }
            }
            else {
                paramObj.set(`$${++i}`, p.value);
            }
        }

        return paramObj;
    }
    protected override toSqlParameterString(expression: SqlParameterExpression, param: IQueryBuilderContext): string {
        const paramValue = param.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }

        let qparams = this.getQueryParameters(param);
        if (!param.option?.supportTVP) {
            qparams = qparams.filter(o => !(o instanceof SqlTableValueParameterExpression));
        }
        const indexMap = Enumerable.from(param.parameters)
            .filter(o => qparams.includes(o[0]))
            .flatMap(o => {
                if (o[0] instanceof SqlTableValueParameterExpression) {
                    return o[0].columns.map(_ => o[1].name);
                }
                return [o[1].name];
            })
            .toArray();
        const index = indexMap.indexOf(paramValue.name) + 1;
        if (index && expression instanceof SqlTableValueParameterExpression) {
            return `UNNEST(${expression.columns.map((col, i) => {
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
                return `$${index + i}::${columnType}[]`
            }).join(",")}) AS ${this.enclose(expression.alias)}(${expression.columns.map(o => o.columnName).join(", ")})`;
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

                result.push(...this.createTempTableQuery(key, valueExp.value as unknown[], context));
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

            let relation: IExpression<boolean>;
            for (const column of updateExp.entity.primaryColumns) {
                const selectColumn = projectedEntity.columns.find(o => o.propertyName == column.propertyName);
                const equalExp = new StrictEqualExpression(column, selectColumn);
                relation = relation ? new AndExpression(relation, equalExp) : equalExp;
            }
            updateQuery += `${this.newLine()}WHERE ${this.toLogicalString(relation, context)}`;
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

        const includedDeletes = updateExp.includes.flatMap((o) => this.getUpdateQuery(o.child, context.option, context.parameters));
        result.push(...includedDeletes);
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

                result.push(...this.createTempTableQuery(key, valueExp.value as unknown[], context));
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

            let relation: IExpression<boolean>;
            for (const column of deleteExp.entity.primaryColumns) {
                const selectColumn = projectedEntity.columns.find(o => o.propertyName == column.propertyName);
                const equalExp = new StrictEqualExpression(column, selectColumn);
                relation = relation ? new AndExpression(relation, equalExp) : equalExp;
            }
            deleteQuery += `${this.newLine()}WHERE ${this.toLogicalString(relation, context)}`;

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
    protected override entityName<T extends object>(entityExp: IEntityExpression<T>): string {
        if (entityExp instanceof SqlTableValueParameterExpression) {
            return `pg_temp.${this.enclose(entityExp.name)}`;
        }

        return super.entityName(entityExp);
    }
}
