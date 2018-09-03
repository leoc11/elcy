import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../../Common/ColumnType";
import { IColumnTypeDefaults } from "../../Common/IColumnTypeDefaults";
import { GenericType, JoinType, QueryType, ColumnGeneration } from "../../Common/Type";
import { TimeSpan } from "../../Data/TimeSpan";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { QueryTranslator } from "../../QueryBuilder/QueryTranslator/QueryTranslator";
import { UUID } from "../../Data/UUID";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { CustomEntityExpression } from "../../Queryable/QueryExpression/CustomEntityExpression";
import { ComputedColumnExpression } from "../../Queryable/QueryExpression/ComputedColumnExpression";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { relationalQueryTranslator } from "../../QueryBuilder/QueryTranslator/RelationalQueryTranslator";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { isNotNull } from "../../Helper/Util";

export const mssqlQueryTranslator = new QueryTranslator(Symbol("mssql"));
mssqlQueryTranslator.registerFallbacks(relationalQueryTranslator);
mssqlQueryTranslator.register(UUID, "new", () => "NEWID()");
export class MssqlQueryBuilder extends QueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 2100,
        maxQueryLength: 67108864
    };
    public supportedColumnTypes: Map<ColumnType, ColumnGroupType> = new Map<ColumnType, ColumnGroupType>([
        ["bigint", "Numeric"],
        ["bit", "Boolean"],
        ["decimal", "Decimal"],
        ["int", "Numeric"],
        ["money", "Decimal"],
        ["numeric", "Decimal"],
        ["smallint", "Numeric"],
        ["smallmoney", "Decimal"],
        ["tinyint", "Numeric"],
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
        ["timestamp", "RowVersion"],
        ["uniqueidentifier", "Identifier"],
        ["xml", "DataString"]
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
        ["defaultDataString", "xml"],
        ["defaultDate", "date"],
        ["defaultDateTime", "datetime"],
        ["defaultTime", "time"],
        ["defaultDecimal", "decimal"],
        ["defaultEnum", "nvarchar"],
        ["defaultIdentifier", "uniqueidentifier"],
        ["defaultNumberic", "int"],
        ["defaultString", "nvarchar"],
        ["defaultRowVersion", "timestamp"]
    ]);
    public valueTypeMap = new Map<GenericType, ColumnType>([
        [TimeSpan, "time"],
        [Date, "datetime"],
        [String, "nvarchar"],
        [Number, "decimal"],
        [Boolean, "bit"]
    ]);
    public translator = mssqlQueryTranslator;
    public getSelectQuery<T>(select: SelectExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        let take = 0, skip = 0;
        if (select.paging.take) {
            const takeParam = this.parameters.first(o => o.parameter === select.paging.take);
            if (takeParam) {
                take = takeParam.value;
            }
        }
        if (select.paging.skip) {
            const skipParam = this.parameters.first(o => o.parameter === select.paging.skip);
            if (skipParam)
                skip = skipParam.value;
        }
        const hasIncludes = select.includes.length > 0;
        const tempTableName = "#temp_" + (select.entity.alias ? select.entity.alias : select.entity.name);
        let selectQuery = "SELECT" + (select.distinct ? " DISTINCT" : "") + (skip <= 0 && take > 0 ? " TOP " + take : "") +
            " " + select.projectedColumns.select((o) => this.getColumnSelectString(o)).toArray().join("," + this.newLine(1, false)) +
            (hasIncludes ? this.newLine() + "INTO " + tempTableName : "") +
            this.newLine() + "FROM " + this.getEntityQueryString(select.entity) +
            this.getEntityJoinString(select.entity, select.joins);
        if (select.where)
            selectQuery += this.newLine() + "WHERE " + this.getOperandString(select.where);
        if (select instanceof GroupByExpression) {
            if (select.groupBy.length > 0) {
                selectQuery += this.newLine() + "GROUP BY " + select.groupBy.select((o) => this.getColumnDefinitionString(o)).toArray().join(", ");
            }
            if (select.having) {
                selectQuery += this.newLine() + "HAVING " + this.getOperandString(select.having);
            }
        }
        if (select.orders.length > 0)
            selectQuery += this.newLine() + "ORDER BY " + select.orders.select((c) => this.getExpressionString(c.column) + " " + c.direction).toArray().join(", ");

        if (skip > 0) {
            selectQuery += this.newLine() + this.getPagingQueryString(select, take, skip);
        }
        result.push({
            query: selectQuery,
            parameters: this.getParameter(select),
            type: hasIncludes ? QueryType.DML : QueryType.DQL
        });
        // if has other includes, then convert to temp table
        if (hasIncludes) {
            result.push({
                query: "SELECT * FROM " + tempTableName,
                type: QueryType.DQL
            });

            const tempSelect = new SelectExpression(new CustomEntityExpression(tempTableName, select.projectedColumns.select(o => {
                if (o instanceof ComputedColumnExpression)
                    return new ColumnExpression(o.entity, o.type, o.propertyName, o.columnName, o.isPrimary);
                return o;
            }).toArray(), select.itemType, tempTableName.substr(1)));
            tempSelect.relationColumns = tempSelect.entity.columns.slice(0);
            const replaceMap = new Map();
            for (const col of select.projectedColumns) {
                const customCol = tempSelect.entity.columns.find(o => o.columnName === col.columnName);
                replaceMap.set(col, customCol);
            }
            // select each include as separated query as it more beneficial for performance
            for (const include of select.includes) {
                // add join to temp table
                for (const key of include.child.projectedColumns) {
                    replaceMap.set(key, key);
                }
                const relations = include.relations.clone(replaceMap);
                const tempJoin = include.child.addJoinRelation(tempSelect, relations, JoinType.INNER);
                result = result.concat(this.getSelectQuery(include.child));
                include.child.joins.remove(tempJoin);
            }

            result.push({
                query: "DROP TABLE " + tempTableName,
                type: QueryType.DDL
            });
        }
        return result;
    }
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
        const colString = insertExp.columns.select(o => this.enclose(o.columnName)).toArray().join(", ");
        let output = insertExp.entity.columns.where(o => isNotNull(o.columnMetaData))
            .where(o => o.columnMetaData!.generation === ColumnGeneration.Insert || o.columnMetaData!.default !== undefined)
            .select(o => `INSERTED.${this.enclose(o.columnName)} AS ${o.propertyName}`).toArray().join(", ");
        if (output) {
            output = " OUTPUT " + output;
        }

        const insertQuery = `INSERT INTO ${this.getEntityQueryString(insertExp.entity)}(${colString})${output} VALUES`;
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

        return result;
    }
}
