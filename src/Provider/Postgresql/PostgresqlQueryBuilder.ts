import { Enumerable, IEnumerable } from "@elcy/enumerable";
import { IQuery } from "src/Query/IQuery";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { isNotNull } from "src/Helper/Util";
import { IQueryBuilderParameter } from "src/Query/IQueryBuilderParameter";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { QueryType } from "src/Common/Enum";
import { AdditionExpression } from "src/ExpressionBuilder/Expression/AdditionExpression";
import { MethodCallExpression } from "src/ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { DbFunction } from "src/Query/DbFunction";
import { IQueryOption } from "src/Query/IQueryOption";
import { IQueryParameterMap } from "src/Query/IQueryParameter";
import { UpdateExpression } from "src/Queryable/QueryExpression/UpdateExpression";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";

export class PostgresqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 34464
    };
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType>([
        [Uuid, () => ({ columnType: "uuid", group: "Identifier" })],
        [BigInt, () => ({ columnType: "bigint", group: "Integer" })],
        [TimeSpan, () => ({ columnType: "time", group: "Time" })],
        [Date, () => ({ columnType: "datetime", group: "DateTime" })],
        [String, (val: string) => ({ columnType: "nvarchar", group: "String", option: { length: Math.ceil(val.length / 50) * 50 } })],
        [Number, () => ({ columnType: "decimal", group: "Decimal" })],
        [Boolean, () => ({ columnType: "bit", group: "Boolean" })]
    ]);

    public override enclose(identity: string) {
        let requireEscape = this.namingStrategy.enableEscape;
        if (!requireEscape) {
            requireEscape = identity.search(/[A-Z]/) !== -1;
        }
        if (requireEscape && identity[0] !== "$") {
            return "\"" + identity + "\"";
        }
        else {
            return identity;
        }
    }

    protected override mergeQueries(queries: IEnumerable<IQuery>): IQuery[] {
        // only able to support merged for query without parameter
        return Enumerable.from(queries).toArray();
    }

    protected override toSqlParameterString(expression: SqlParameterExpression, param?: IQueryBuilderParameter): string {
        const paramValue = param.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }

        if (!isNotNull(paramValue.value)) {
            return this.nullString();
        }
        const indexMap = Enumerable.from(param.parameters.values()).select(o => o.name).distinct().toArray();
        const index = indexMap.indexOf(paramValue.name);
        return `$${index + 1}`;
    }

    protected override getUpdateQuery<T extends object>(updateExp: UpdateExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: updateExp,
            parameters: parameters,
            option: option
        };

        const setQuery = Object.keys(updateExp.setter).map((o: keyof T) => {
            const value = updateExp.setter[o];
            const valueStr = this.toOperandString(value, param);
            const column = updateExp.entity.columns.find((c) => c.propertyName === o);
            return `${this.enclose(column.columnName)} = ${valueStr}`;
        });

        if (updateExp.entity.metaData) {
            if (updateExp.entity.metaData.modifiedDateColumn) {
                const colMeta = updateExp.entity.metaData.modifiedDateColumn;
                // only update modifiedDate column if not explicitly specified in update set statement.
                if (!updateExp.setter[colMeta.propertyName]) {
                    const valueExp = new MethodCallExpression(new ValueExpression(DbFunction), colMeta.timeZoneHandling === "utc" ? "utcTimestamp" : "timestamp", []);
                    const valueStr = this.toString(valueExp, param);
                    setQuery.push(`${this.enclose(colMeta.columnName)} = ${valueStr}`);
                }
            }

            if (updateExp.entity.metaData.versionColumn) {
                const colMeta = updateExp.entity.metaData.versionColumn;
                if (updateExp.setter[colMeta.propertyName]) {
                    throw new Error(`${colMeta.propertyName} is a version column and should not be update explicitly`);
                }

                const valueExp = new AdditionExpression(updateExp.entity.versionColumn, new ValueExpression(1));
                const valueStr = this.toString(valueExp, param);
                setQuery.push(`${this.enclose(colMeta.columnName)} = ${valueStr}`);
            }
        }

        let firstJoin: JoinRelation<T> = null;
        const whereQueries: string[] = [];
        let joins = updateExp.joins.slice();
        if (joins.length) {
            firstJoin = joins.shift();
            whereQueries.push(this.toLogicalString(firstJoin.relation, param));
        }
        if (updateExp.where) {
            whereQueries.push(this.toLogicalString(updateExp.where, param));
        }
        let updateQuery = `UPDATE ${this.entityName(updateExp.entity)} AS ${this.enclose(updateExp.entity.alias)}` +
            this.newLine() + `SET ${setQuery.join(", ")}`;

        if (firstJoin) {
            updateQuery += this.newLine() + `FROM ${this.entityName(updateExp.entity)} AS ${this.enclose(updateExp.entity.alias)}` +
                this.getJoinQueryString(joins, param);
        }
        if (whereQueries.length) {
            updateQuery += this.newLine() + "WHERE " + whereQueries.join(" AND ");
        }

        if (updateExp.returnings.length) {
            updateQuery += `${this.newLine()}RETURNING ${updateExp.returnings.map(o => this.enclose(o.columnName)).join(",")}`
        }

        result.push({
            query: updateQuery,
            type: QueryType.DML,
            parameters: this.getParameter(param)
        });

        return result;
    }
}
