import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../../Common/ColumnType";
import { IColumnTypeDefaults } from "../../Common/IColumnTypeDefaults";
import { GenericType, QueryType, ColumnGeneration } from "../../Common/Type";
import { TimeSpan } from "../../Data/TimeSpan";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { UUID } from "../../Data/UUID";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { isNotNull } from "../../Helper/Util";
import { SelectIntoExpression } from "../../Queryable/QueryExpression/SelectIntoExpression";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";

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
        ["char", { length: 10 }],
        ["datetime2", { precision: 1 }],
        ["datetimeoffset", { precision: 7 }],
        ["time", { precision: 7 }],
        ["decimal", { precision: 18, scale: 0 }],
        ["nchar", { length: 10 }],
        ["numeric", { precision: 18, scale: 0 }],
        ["nvarchar", { length: 255 }],
        ["varbinary", { length: 50 }],
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
        ["defaultRowVersion", "timestamp"]
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
    public getSelectInsertQuery<T>(selectInto: SelectIntoExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        const selectExp = this.getSelectQueryString(selectInto, true);
        const intoString = this.newLine() + `INSERT INTO ${this.entityQuery(selectInto.entity)}${this.newLine()} (${selectInto.projectedColumns.select((o) => this.enclose(o.columnName)).toArray().join(",")})`;
        const index = selectExp.indexOf(this.newLine() + "FROM ");
        let selectQuery = selectExp.substring(0, index) + intoString + selectExp.substring(index);
        result.push({
            query: selectQuery,
            parameters: this.getParameter(selectInto),
            type: QueryType.DML
        });

        return result;
    }
    public getInsertQuery<T>(insertExp: InsertExpression<T>): IQuery[] {
        if (insertExp.values.length <= 0)
            return [];

        const colString = insertExp.columns.select(o => this.enclose(o.columnName)).toArray().join(", ");
        let output = insertExp.entity.columns.where(o => isNotNull(o.columnMetaData))
            .where(o => o.columnMetaData!.generation === ColumnGeneration.Insert || o.columnMetaData!.default !== undefined)
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
            
            queryCommand.query += `${this.newLine(1, true)}(${insertExp.columns.select(o => {
                const valueExp = itemExp[o.propertyName];
                return valueExp ? this.getExpressionString(valueExp) : "DEFAULT";
            }).toArray().join(",")}),`;
        });
        queryCommand.query = queryCommand.query.slice(0, -1);

        return result;
    }
}
