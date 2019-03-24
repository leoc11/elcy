import { RelationQueryBuilder } from "../Relation/RelationQueryBuilder";
import { QueryType, ColumnGeneration, IObjectType, GenericType } from "../../Common/Type";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQuery } from "../../Query/IQuery";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { isNotNull } from "../../Helper/Util";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameter } from "../../Query/IQueryParameter";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { Uuid } from "../../Data/Uuid";
import { TimeSpan } from "../../Data/TimeSpan";

export class MssqlQueryBuilder extends RelationQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 2100,
        maxQueryLength: 67108864
    };
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType>([
        [Uuid, () => ({ columnType: "uniqueidentifier", group: "Identifier" })],
        [TimeSpan, () => ({ columnType: "time", group: "Time" })],
        [Date, () => ({ columnType: "datetime", group: "DateTime" })],
        [String, (val: string) => ({ columnType: "nvarchar", group: "String", option: { length: 255 } })],
        [Number, () => ({ columnType: "decimal", group: "Decimal", option: { precision: 18, scale: 0 } })],
        [Boolean, () => ({ columnType: "bit", group: "Boolean" })]
    ]);
    public translator = mssqlQueryTranslator;
    protected getPagingQueryString(select: SelectExpression, take: number, skip: number): string {
        let result = "";
        if (select.orders.length <= 0)
            result += "ORDER BY (SELECT NULL)" + this.newLine();
        result += "OFFSET " + skip + " ROWS";
        if (take > 0)
            result += this.newLine() + "FETCH NEXT " + take + " ROWS ONLY";
        return result;
    }
    public enclose(identity: string) {
        if (this.namingStrategy.enableEscape && identity[0] !== "@" && identity[0] !== "#")
            return "[" + identity + "]";
        else
            return identity;
    }
    public getInsertQuery<T>(insertExp: InsertExpression<T>, option: IQueryOption, parameters: IQueryParameter[]): IQuery[] {
        if (insertExp.values.length <= 0)
            return [];

        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: insertExp
        };
        const colString = insertExp.columns.select(o => this.enclose(o.columnName)).toArray().join(", ");
        let output = insertExp.entity.columns.where(o => isNotNull(o.columnMetaData))
            .where(o => (o.columnMetaData!.generation & ColumnGeneration.Insert) !== 0 || !!o.columnMetaData!.default)
            .select(o => `INSERTED.${this.enclose(o.columnName)} AS ${o.propertyName}`).toArray().join(", ");
        if (output) {
            output = " OUTPUT " + output;
        }

        const insertQuery = `INSERT INTO ${this.enclose(insertExp.entity.name)}(${colString})${output} VALUES`;
        let queryCommand: IQuery = {
            query: insertQuery,
            parameters: {},
            type: QueryType.DML
        };
        if (output) queryCommand.type |= QueryType.DQL;

        const result: IQuery[] = [queryCommand];
        let parameterKeys: string[] = [];
        let isLimitExceed = false;
        this.indent++;
        insertExp.values.each(itemExp => {
            if (this.queryLimit.maxParameters) {
                const curParamKeys: string[] = [];
                for (const prop in itemExp) {
                    const value = itemExp[prop];
                    const paramExp = parameters.first(o => o.paramExp === value);
                    if (paramExp) {
                        curParamKeys.push(paramExp.name);
                    }
                }
                const keys = parameterKeys.union(curParamKeys).toArray();
                isLimitExceed = keys.length > this.queryLimit.maxParameters;
                if (!isLimitExceed) {
                    parameterKeys = keys;
                }
            }

            if (isLimitExceed) {
                queryCommand.query = queryCommand.query.slice(0, -1);
                queryCommand.parameters = parameterKeys.select(o => parameters.first(p => p.name === o)).reduce({} as { [key: string]: any }, (acc, item) => {
                    acc[item.name] = item.value;
                    return acc;
                });

                isLimitExceed = false;
                parameterKeys = [];

                queryCommand = {
                    query: insertQuery,
                    parameters: {},
                    type: QueryType.DML | QueryType.DQL
                };
                result.push(queryCommand);
            }

            queryCommand.query += `${this.newLine()}(${insertExp.columns.select(o => {
                const valueExp = itemExp[o.propertyName];
                return valueExp ? this.toString(valueExp, param) : "DEFAULT";
            }).toArray().join(",")}),`;
        });
        this.indent--;
        queryCommand.query = queryCommand.query.slice(0, -1);
        queryCommand.parameters = parameterKeys.select(o => parameters.first(p => p.name === o)).reduce({} as { [key: string]: any }, (acc, item) => {
            acc[item.name] = item.value;
            return acc;
        });

        return result;
    }

    //#region Update
    public getUpdateQuery<T>(updateExp: UpdateExpression<T>, option: IQueryOption, parameters: IQueryParameter[]): IQuery[] {
        let result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: updateExp
        };

        const setQuery = Object.keys(updateExp.setter).select((o: keyof T) => {
            const value = updateExp.setter[o];
            const valueStr = this.toOperandString(value, param);
            const column = updateExp.entity.columns.first(c => c.propertyName === o);
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
            this.newLine() + `FROM ${this.enclose(updateExp.entity.name)} AS ${this.enclose(updateExp.entity.alias)} ` +
            this.getJoinQueryString(updateExp.joins, param);
        if (updateExp.where)
            updateQuery += this.newLine() + "WHERE " + this.toLogicalString(updateExp.where, param);

        result.push({
            query: updateQuery,
            parameters: this.getParameter(param),
            type: QueryType.DML
        });

        return result;
    }
    //#endregion
    public toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T {
        if (column instanceof RowVersionColumnMetaData) {
            return new (column.type as IObjectType<T>)(input.buffer ? input.buffer : input);
        }
        return super.toPropertyValue(input, column);
    }
    public toParameterValue(input: any, column: IColumnMetaData): any {
        if (!isNotNull(input)) {
            return null;
        }
        if (column instanceof ColumnExpression && column.columnMetaData instanceof RowVersionColumnMetaData) {
            return new Uint8Array(input.buffer ? input.buffer : input);
        }
        return super.toParameterValue(input, column);
    }
}
