import { ColumnGeneration, QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, IObjectType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { isNotNull, isNull } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { DbFunction } from "../../Query/DbFunction";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { MssqlColumnType } from "./MssqlColumnType";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { Enumerable } from "@elcy/enumerable";

export class MssqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 2100,
        maxQueryLength: 67108864
    };
    public override translator = mssqlQueryTranslator;
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType<MssqlColumnType>>([
        [Uuid, () => ({ columnType: "uniqueidentifier", group: "Identifier" })],
        [BigInt, () => ({ columnType: "bigint", group: "BigInt" })],
        [TimeSpan, () => ({ columnType: "time", group: "Time" })],
        [Date, () => ({ columnType: "datetime", group: "DateTime" })],
        [String, (val: string) => ({ columnType: "nvarchar", group: "String", option: { length: 255 } })],
        [Number, () => ({ columnType: "decimal", group: "Decimal", option: { precision: 18, scale: 0 } })],
        [Boolean, () => ({ columnType: "bit", group: "Boolean" })]
    ]);
    public override enclose(identity: string) {
        if (this.namingStrategy.enableEscape && identity[0] !== "@" && identity[0] !== "#") {
            return "[" + identity + "]";
        }
        else {
            return identity;
        }
    }
    public override getInsertQuery<T>(insertExp: InsertExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
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

    //#region Update
    public override getUpdateQuery<T>(updateExp: UpdateExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
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
    public override toParameterValue(input: any, column: IColumnMetaData): any {
        if (isNull(input)) {
            return null;
        }
        if (column instanceof ColumnExpression && column.columnMeta instanceof RowVersionColumnMetaData) {
            return new Uint8Array(input.buffer ? input.buffer : input);
        }
        return super.toParameterValue(input, column);
    }
    //#endregion
    public override toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T {
        if (column instanceof RowVersionColumnMetaData) {
            return new (column.type as IObjectType<T>)(input.buffer ? input.buffer : input);
        }
        return super.toPropertyValue(input, column);
    }
    protected override booleanString(value: boolean) {
        return value ? "1" : "0";
    }
}
