import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../../Common/ColumnType";
import { IColumnTypeDefaults } from "../../Common/IColumnTypeDefaults";
import { GenericType, QueryType, ColumnGeneration, IObjectType } from "../../Common/Type";
import { TimeSpan } from "../../Data/TimeSpan";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { UUID } from "../../Data/UUID";
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

export class MssqlQueryBuilder extends QueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 2100,
        maxQueryLength: 67108864
    };
    public supportedColumnTypes: Map<ColumnType, ColumnGroupType> = new Map<ColumnType, ColumnGroupType>([
        ["bigint", "Integer"],
        ["bit", "Boolean"],
        ["decimal", "Decimal"],
        ["int", "Integer"],
        ["money", "Decimal"],
        ["numeric", "Decimal"],
        ["smallint", "Integer"],
        ["smallmoney", "Decimal"],
        ["tinyint", "Integer"],
        ["float", "Decimal"],
        ["real", "Decimal"],
        ["date", "Date"],
        ["datetime2", "Date"],
        ["datetime", "Date"],
        ["datetimeoffset", "Time"],
        ["smalldatetime", "Date"],
        ["time", "Time"],
        ["char", "String"],
        ["text", "String"],
        ["varchar", "String"],
        ["nchar", "String"],
        ["ntext", "String"],
        ["nvarchar", "String"],
        ["binary", "Binary"],
        ["image", "Binary"],
        ["varbinary", "Binary"],
        ["cursor", "Binary"],
        ["hierarchyid", "Binary"],
        ["sql_variant", "Binary"],
        ["table", "Binary"],
        ["rowversion", "RowVersion"],
        ["uniqueidentifier", "Identifier"],
        ["xml", "DataSerialization"]
    ]);
    public columnTypesWithOption: ColumnType[] = [
        "binary",
        "char",
        "datetime2",
        "datetimeoffset",
        "time",
        "decimal",
        "nchar",
        "numeric",
        "nvarchar",
        "varbinary",
        "varchar",
    ];
    public columnTypeDefaults = new Map<ColumnType, IColumnTypeDefaults>([
        ["binary", { size: 50 }],
        ["varbinary", { size: 100 }],
        ["char", { length: 10 }],
        ["datetime2", { precision: 1 }],
        ["datetimeoffset", { precision: 7 }],
        ["time", { precision: 7 }],
        ["decimal", { precision: 18, scale: 0 }],
        ["nchar", { length: 10 }],
        ["numeric", { precision: 18, scale: 0 }],
        ["nvarchar", { length: 255 }],
        ["varchar", { length: 50 }]
    ]);
    public columnTypeMap = new Map<ColumnTypeMapKey, ColumnType>([
        ["defaultBoolean", "bit"],
        ["defaultBinary", "binary"],
        ["defaultDataSerialization", "xml"],
        ["defaultDate", "date"],
        ["defaultDateTime", "datetime"],
        ["defaultTime", "time"],
        ["defaultDecimal", "decimal"],
        ["defaultEnum", "nvarchar"],
        ["defaultIdentifier", "uniqueidentifier"],
        ["defaultInteger", "int"],
        ["defaultString", "nvarchar"],
        ["defaultRowVersion", "rowversion"]
    ]);
    public valueTypeMap = new Map<GenericType, ColumnType>([
        [UUID, "uniqueidentifier"],
        [TimeSpan, "time"],
        [Date, "datetime"],
        [String, "nvarchar"],
        [Number, "decimal"],
        [Boolean, "bit"]
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
    public getInsertQuery<T>(insertExp: InsertExpression<T>): IQuery[] {
        if (insertExp.values.length <= 0)
            return [];

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
        insertExp.values.each(itemExp => {
            if (this.queryLimit.maxParameters) {
                const curParamKeys: string[] = [];
                for (const prop in itemExp) {
                    const value = itemExp[prop];
                    const param = this.parameters.first(o => o.parameter === value);
                    if (param) {
                        curParamKeys.push(param.name);
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
                queryCommand.parameters = parameterKeys.select(o => this.parameters.first(p => p.name === o)).reduce({} as { [key: string]: any }, (acc, item) => {
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

            queryCommand.query += `${this.newLine(1, false)}(${insertExp.columns.select(o => {
                const valueExp = itemExp[o.propertyName];
                return valueExp ? this.getExpressionString(valueExp) : "DEFAULT";
            }).toArray().join(",")}),`;
        });
        queryCommand.query = queryCommand.query.slice(0, -1);
        queryCommand.parameters = parameterKeys.select(o => this.parameters.first(p => p.name === o)).reduce({} as { [key: string]: any }, (acc, item) => {
            acc[item.name] = item.value;
            return acc;
        });

        return result;
    }

    //#region Update
    public getBulkUpdateQuery<T>(updateExp: UpdateExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        const prevCommandExp = this.commandExp;
        this.commandExp = updateExp;
        const setQuery = Object.keys(updateExp.setter).select((o: keyof T) => {
            const value = updateExp.setter[o];
            const valueStr = this.getOperandString(value);
            const column = updateExp.entity.columns.first(c => c.propertyName === o);
            return `${this.enclose(updateExp.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
        }).toArray();

        if (updateExp.entity.metaData) {
            if (updateExp.entity.metaData.modifiedDateColumn) {
                const colMeta = updateExp.entity.metaData.modifiedDateColumn;
                // only update modifiedDate column if not explicitly specified in update set statement.
                if (!updateExp.setter[colMeta.propertyName]) {
                    const valueExp = new MethodCallExpression(new ValueExpression(Date), "timestamp", [new ValueExpression(colMeta.timeZoneHandling === "utc")]);
                    const valueStr = this.getExpressionString(valueExp);
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
            this.joinString(updateExp.joins);
        if (updateExp.where)
            updateQuery += this.newLine() + "WHERE " + this.getLogicalOperandString(updateExp.where);

        result.push({
            query: updateQuery,
            parameters: this.getParameter(updateExp),
            type: QueryType.DML
        });

        this.commandExp = prevCommandExp;
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
