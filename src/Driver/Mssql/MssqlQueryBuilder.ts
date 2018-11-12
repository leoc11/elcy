import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../../Common/ColumnType";
import { IColumnTypeDefaults } from "../../Common/IColumnTypeDefaults";
import { GenericType, QueryType, ColumnGeneration } from "../../Common/Type";
import { TimeSpan } from "../../Data/TimeSpan";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { UUID } from "../../Data/UUID";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { isNotNull } from "../../Helper/Util";
import { SelectIntoExpression } from "../../Queryable/QueryExpression/SelectIntoExpression";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { ComputedColumnExpression } from "../../Queryable/QueryExpression/ComputedColumnExpression";
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
    public getExpressionString<T = any>(expression: IExpression<T>): string {
        let res = super.getExpressionString(expression);
        if (this.isStrictSql) {
            if (!(expression instanceof SelectExpression || expression instanceof ComputedColumnExpression || expression instanceof ColumnExpression || (expression as IBinaryOperatorExpression).rightOperand)) {
                res = `(${res})`;
            }

        }
        return res;
    }
    public enclose(identity: string) {
        if (this.namingStrategy.enableEscape && identity[0] !== "@" && identity[0] !== "#")
            return "[" + identity + "]";
        else
            return identity;
    }
    public getSelectInsertQuery<T>(selectInto: SelectIntoExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        let take = 0, skip = 0;
        if (selectInto.paging.take) {
            const takeParam = this.parameters.first(o => o.parameter.valueGetter === selectInto.paging.take);
            if (takeParam) {
                take = takeParam.value;
            }
        }
        if (selectInto.paging.skip) {
            const skipParam = this.parameters.first(o => o.parameter.valueGetter === selectInto.paging.skip);
            if (skipParam)
                skip = skipParam.value;
        }

        let selectQuery =
            `SELECT ${selectInto.distinct ? "DISTINCT" : ""} ${skip <= 0 && take > 0 ? "TOP" + take : ""}` +
            selectInto.projectedColumns.select((o) => this.getColumnSelectString(o)).toArray().join("," + this.newLine(1, false)) + this.newLine() +
            `INSERT INTO ${this.getEntityQueryString(selectInto.entity)}${this.newLine()} (${selectInto.projectedColumns.select((o) => this.enclose(o.columnName)).toArray().join(",")})` + this.newLine() +
            `FROM ${this.getEntityQueryString(selectInto.entity)}${this.getEntityJoinString(selectInto.joins)}`;

        if (selectInto.where)
            selectQuery += this.newLine() + `WHERE ${this.getOperandString(selectInto.where)}`;
        if (selectInto instanceof GroupByExpression) {
            if (selectInto.groupBy.length > 0) {
                selectQuery += this.newLine() + "GROUP BY " + selectInto.groupBy.select((o) => this.getColumnDefinitionString(o)).toArray().join(", ");
            }
            if (selectInto.having) {
                selectQuery += this.newLine() + "HAVING " + this.getOperandString(selectInto.having);
            }
        }

        if (selectInto.orders.length > 0)
            selectQuery += this.newLine() + "ORDER BY " + selectInto.orders.select((c) => this.getExpressionString(c.column) + " " + c.direction).toArray().join(", ");

        if (skip > 0) {
            if (selectInto.orders.length <= 0)
                selectQuery += this.newLine() + "ORDER BY (SELECT NULL)";
            selectQuery += this.newLine() + this.getPagingQueryString(selectInto.select, take, skip);
        }

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
        insertExp.values.each(o => {
            if (this.queryLimit.maxParameters) {
                const curParamKeys = o.select(o => this.parameters.first(p => p.parameter === o)).where(o => !!o).select(o => o.name);
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
            queryCommand.query += `${this.newLine(1, true)}(${o.select(o => o ? this.getExpressionString(o) : "DEFAULT").toArray().join(",")}),`;
        });
        queryCommand.query = queryCommand.query.slice(0, -1);

        return result;
    }
}
