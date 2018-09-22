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
import { isNotNull, replaceExpression } from "../../Helper/Util";
import { SelectIntoExpression } from "../../Queryable/QueryExpression/SelectIntoExpression";
import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { DbFunction } from "../../QueryBuilder/DbFunction";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";

export const mssqlQueryTranslator = new QueryTranslator(Symbol("mssql"));
mssqlQueryTranslator.registerFallbacks(relationalQueryTranslator);
mssqlQueryTranslator.register(UUID, "new", () => "NEWID()");
mssqlQueryTranslator.register(DbFunction, "lastInsertedId", () => `SCOPE_IDENTITY()`);
mssqlQueryTranslator.register(DbFunction, "coalesce", (exp: MethodCallExpression, qb: QueryBuilder) => `COALESCE(${exp.params.select(o => qb.getExpressionString(o)).toArray().join(", ")})`);

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
    public getSelectQuery<T>(select: SelectExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        let take = 0, skip = 0;
        if (select.paging.take) {
            if (select.paging.take instanceof ValueExpression) {
                take = select.paging.take.execute();
            }
            else {
                const takeParam = this.parameters.first(o => o.parameter === select.paging.take);
                if (takeParam)
                    take = takeParam.value;
            }
        }
        if (select.paging.skip) {
            if (select.paging.skip instanceof ValueExpression) {
                skip = select.paging.skip.execute();
            }
            else {
                const skipParam = this.parameters.first(o => o.parameter === select.paging.skip);
                if (skipParam)
                    skip = skipParam.value;
            }
        }
        const hasIncludes = select.includes.length > 0;
        const tempTableName = "#temp_" + (select.entity.alias ? select.entity.alias : select.entity.name);
        let selectQuery = "SELECT" + (select.distinct ? " DISTINCT" : "") + (skip <= 0 && take > 0 ? " TOP " + take : "") +
            " " + select.projectedColumns.select((o) => this.getColumnSelectString(o)).toArray().join("," + this.newLine(1, false)) +
            (hasIncludes ? this.newLine() + "INTO " + tempTableName : "") +
            this.newLine() + "FROM " + this.getEntityQueryString(select.entity) +
            this.getEntityJoinString(select.joins);
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
            if (select.orders.length <= 0)
                selectQuery += this.newLine() + "ORDER BY (SELECT NULL)";
            selectQuery += this.newLine() + this.getPagingQueryString(take, skip);
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

            let tempSelect: SelectExpression;
            // select each include as separated query as it more beneficial for performance
            for (const include of select.includes) {
                if (include.isFinish) {
                    result = result.concat(this.getSelectQuery(include.child));
                }
                else {
                    if (!tempSelect) {
                        tempSelect = new SelectExpression(new CustomEntityExpression(tempTableName, select.projectedColumns.select(o => {
                            if (o instanceof ComputedColumnExpression)
                                return new ColumnExpression(o.entity, o.type, o.propertyName, o.alias ? o.alias : o.columnName, o.isPrimary);
                            return o;
                        }).toArray(), select.itemType, tempTableName.substr(1)));
                        tempSelect.relationColumns = tempSelect.entity.columns.slice(0);
                    }

                    // add join to temp table
                    const replaceMap = new Map();
                    for (const key of include.child.projectedColumns) {
                        replaceMap.set(key, key);
                    }
                    for (const key of include.parent.projectedColumns) {
                        const tempKey = tempSelect.entity.columns.first(o => o.columnName === key.columnName);
                        replaceMap.set(key, tempKey);
                    }
                    const relations = include.relations.clone(replaceMap);

                    let requireRelationData = false;
                    const relMap = new Map<IColumnExpression, IColumnExpression>();
                    const parent = include.child;

                    replaceExpression(relations, (exp: IExpression) => {
                        if (!requireRelationData) {
                            if (exp instanceof EqualExpression || exp instanceof StrictEqualExpression) {
                                const leftExp = exp.leftOperand as IColumnExpression;
                                const rightExp = exp.rightOperand as IColumnExpression;
                                let parentCol: IColumnExpression;
                                let childCol: IColumnExpression;
                                if (leftExp.entity) {
                                    if (tempSelect.entity.columns.contains(leftExp)) {
                                        childCol = leftExp;
                                    }
                                    else if (parent.projectedColumns.contains(leftExp)) {
                                        parentCol = leftExp;
                                    }
                                }
                                if (rightExp.entity) {
                                    if (tempSelect.entity.columns.contains(rightExp)) {
                                        childCol = rightExp;
                                    }
                                    else if (parent.projectedColumns.contains(rightExp)) {
                                        parentCol = rightExp;
                                    }
                                }
                                if (parentCol && childCol) {
                                    // TODO: should check whether column is unique
                                    // if both not primary, that means it's a many-many relation
                                    if (!parentCol.isPrimary && !childCol.isPrimary) {
                                        requireRelationData = true;
                                        return exp;
                                    }
                                    relMap.set(parentCol, childCol);
                                }
                            }
                            else if ((exp as IColumnExpression).entity) {
                                const col = exp as IColumnExpression;
                                if (parent.projectedColumns.contains(col)) {
                                    if (col instanceof ComputedColumnExpression) {
                                        return col.expression;
                                    }
                                    return col;
                                }
                                else if (tempSelect.projectedColumns.contains(col)) {
                                    if (col.entity !== tempSelect.entity) {
                                        const colClone = col.clone();
                                        colClone.entity = tempSelect.entity;
                                        return colClone;
                                    }
                                }
                            }
                            else if (!(exp instanceof AndExpression || (exp as IColumnExpression).entity)) {
                                requireRelationData = true;
                            }
                        }
                        return exp;
                    });

                    if (requireRelationData) {
                        const replaceMap = new Map();
                        const relDataSelect = include.child.clone(replaceMap);
                        relDataSelect.entity.alias = "rel_" + relDataSelect.entity.alias;
                        relDataSelect.entity.isRelationData = true;
                        relDataSelect.itemExpression = new ObjectValueExpression({}, Object);
                        relDataSelect.orders = [];
                        relDataSelect.selects = relDataSelect.entity.primaryColumns
                            .union(tempSelect.entity.primaryColumns.select(o => {
                                const col = o.clone();
                                col.entity = o.entity;
                                col.alias = col.propertyName = "_" + col.propertyName;
                                return col;
                            })).toArray();

                        // replace old include with new one
                        select.includes.remove(include);
                        let includeJoinRel: IExpression<boolean>;
                        tempSelect.entity.primaryColumns.each(o => {
                            const relCol = relDataSelect.entity.columns.first(c => c.columnName === o.columnName);
                            const childCol = include.child.entity.columns.first(c => c.columnName === o.columnName);
                            const logicalExp = new StrictEqualExpression(relCol, childCol);
                            includeJoinRel = includeJoinRel ? new AndExpression(includeJoinRel, logicalExp) : logicalExp;
                        });
                        const includeRel = select.addInclude(include.name, relDataSelect, includeJoinRel, "many");
                        includeRel.isFinish = true;
                        includeRel.relationMap = new Map();
                        select.entity.primaryColumns.each(o => {
                            includeRel.relationMap.set(o, relDataSelect.selects.except(relDataSelect.entity.columns).first(c => c.columnName === o.columnName));
                        });

                        // add join to temp
                        const joinRel = relDataSelect.addJoinRelation(tempSelect, relations.clone(replaceMap), JoinType.INNER);
                        joinRel.isFinish = true;

                        // add include to rel data select as bridge
                        let childRel: IExpression<boolean>;
                        include.child.entity.primaryColumns.each(o => {
                            const relCol = relDataSelect.entity.columns.first(c => c.columnName === o.columnName);
                            const logicalExp = new StrictEqualExpression(relCol, o);
                            childRel = childRel ? new AndExpression(childRel, logicalExp) : logicalExp;
                        });
                        relDataSelect.addInclude(include.name, include.child, childRel, "one");
                        result = result.concat(this.getSelectQuery(relDataSelect));
                    }
                    else {
                        include.relationMap = relMap;
                        include.isFinish = true;
                        const tempJoin = include.child.addJoinRelation(tempSelect, relations, JoinType.INNER);
                        tempJoin.isFinish = true;
                        result = result.concat(this.getSelectQuery(include.child));
                    }
                }
            }

            result.push({
                query: "DROP TABLE " + tempTableName,
                type: QueryType.DDL
            });
        }
        return result;
    }
    protected getPagingQueryString(take: number, skip: number): string {
        let result = "OFFSET " + skip + " ROWS";
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
            selectQuery += this.newLine() + this.getPagingQueryString(take, skip);
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
