import { ColumnGeneration, QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { TimeSpan } from "../../Common/TimeSpan";
import { GenericType, IObjectType } from "../../Common/Type";
import { Uuid } from "../../Common/Uuid";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { isNull } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { TempEntityMetaData } from "../../MetaData/TempEntityMetaData";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryTemplate } from "../../Query/IQueryTemplate";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { IEntityExpression } from "../../Queryable/QueryExpression/IEntityExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { MssqlColumnType } from "./MssqlColumnType";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";

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
        [String, () => ({ columnType: "nvarchar", group: "String", option: { length: 255 } })],
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
    public getInsertQuery<T>(insertExp: InsertExpression<T>, option: IQueryOption): IQueryTemplate[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const param: IQueryBuilderParameter = {
            option: option,
            queryExpression: insertExp
        };
        const colString = insertExp.columns.select((o) => this.enclose(o.columnName)).toArray().join(", ");
        let output = insertExp.entity.columns.where((o) => !isNull(o.columnMeta))
            .where((o) => (o.columnMeta!.generation & ColumnGeneration.Insert) !== 0 || !!o.columnMeta!.defaultExp)
            .select((o) => `INSERTED.${this.enclose(o.columnName)} AS ${o.propertyName}`).toArray().join(", ");
        if (output) {
            output = " OUTPUT " + output;
        }

        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity)}(${colString})${output} VALUES`;
        let queryCommand: IQueryTemplate = {
            query: insertQuery,
            parameterTree: insertExp.parameterTree,
            type: QueryType.DML
        };
        if (output) {
            queryCommand.type |= QueryType.DQL;
        }

        const result: IQueryTemplate[] = [queryCommand];
        let count = 0;
        this.indent++;
        for (const itemExp of insertExp.values) {
            const isLimitExceed = this.queryLimit.maxParameters && (count + insertExp.columns.length) > this.queryLimit.maxParameters;
            if (isLimitExceed) {
                queryCommand.query = queryCommand.query.slice(0, -1);
                queryCommand = {
                    query: insertQuery,
                    parameterTree: insertExp.parameterTree,
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
                    count++;
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
    public getUpdateQuery<T>(updateExp: UpdateExpression<T>, option: IQueryOption): IQueryTemplate[] {
        const result: IQueryTemplate[] = [];
        const param: IQueryBuilderParameter = {
            option: option,
            queryExpression: updateExp
        };

        const setQuery = Object.keys(updateExp.setter).select((o: keyof T) => {
            const value = updateExp.setter[o];
            const valueStr = this.toOperandString(value, param);
            const column = updateExp.entity.columns.first((c) => c.propertyName === o);
            return `${this.enclose(updateExp.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
        }).toArray();

        if (updateExp.entity.metaData) {
            if (updateExp.entity.metaData.modifiedDateColumn) {
                const colMeta = updateExp.entity.metaData.modifiedDateColumn;
                // only update modifiedDate column if not explicitly specified in update set statement.
                if (!updateExp.setter[colMeta.propertyName]) {
                    const valueExp = new MethodCallExpression(new ValueExpression(Date), colMeta.timeZoneHandling === "utc" ? "utcTimestamp" : "timestamp", []);
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
            this.newLine() + `FROM ${this.entityName(updateExp.entity)} AS ${this.enclose(updateExp.entity.alias)}` +
            this.getJoinQueryString(updateExp.joins, param);
        if (updateExp.where) {
            updateQuery += this.newLine() + "WHERE " + this.toLogicalString(updateExp.where, param);
        }

        result.push({
            query: updateQuery,
            parameterTree: updateExp.parameterTree,
            type: QueryType.DML
        });

        return result;
    }
    public toParameterValue(input: any, column: IColumnMetaData): any {
        if (isNull(input)) {
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
    protected entityName(entityExp: IEntityExpression, param?: IQueryBuilderParameter) {
        if (entityExp instanceof EntityExpression && entityExp.metaData instanceof TempEntityMetaData) {
            return this.enclose("#" + entityExp.name);
        }
        return this.enclose(entityExp.name);
    }
    protected getPagingQueryString(select: SelectExpression, take: IExpression<number>, skip: IExpression<number>): string {
        let result = "";
        if (select.orders.length <= 0) {
            result += "ORDER BY (SELECT NULL)" + this.newLine();
        }
        result += "OFFSET " + this.toString(skip) + " ROWS";
        if (take) {
            result += this.newLine() + "FETCH NEXT " + this.toString(take) + " ROWS ONLY";
        }
        return result;
    }
}
