import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../../Common/ColumnType";
import { IColumnTypeDefaults } from "../../Common/IColumnTypeDefaults";
import { GenericType, ReferenceOption, JoinType } from "../../Common/Type";
import { TimeSpan } from "../../Common/TimeSpan";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IIndexMetaData } from "../../MetaData/Interface/IIndexMetaData";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { IdentifierColumnMetaData } from "../../MetaData/IdentifierColumnMetaData";
import { NumericColumnMetaData } from "../../MetaData/NumericColumnMetaData";
import { EntityEntry } from "../../Data/EntityEntry";
import { EntityState } from "../../Data/EntityState";
import { Enumerable } from "../../Enumerable/Enumerable";
import { QueryTranslator } from "../../QueryBuilder/QueryTranslator/QueryTranslator";
import { UUID } from "../../Data/UUID";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { CustomEntityExpression } from "../../Queryable/QueryExpression/CustomEntityExpression";
import { ComputedColumnExpression } from "../../Queryable/QueryExpression/ComputedColumnExpression";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";

export const mssqlQueryTranslator = new QueryTranslator(Symbol("mssql"));
mssqlQueryTranslator.register(UUID, "new", () => "NEWID()");
export class MssqlQueryBuilder extends QueryBuilder {
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
        ["timestamp", "Timestamp"],
        ["uniqueidentifier", "Identifier"],
        ["xml", "DataString"]
    ]);
    public columnTypesWithOption: ColumnType[] = [
        "binary",
        "char",
        "datetime2",
        "datetimeoffset",
        "decimal",
        "nchar",
        "numeric",
        "nvarchar",
        "time",
        "varbinary",
        "varchar",
    ];
    public columnTypeDefaults = new Map<ColumnType, IColumnTypeDefaults>([
        ["binary", { size: 50 }],
        ["char", { length: 10 }],
        ["datetime2", { precision: 1 }],
        ["datetimeoffset", { precision: 7 }],
        ["decimal", { precision: 18, scale: 0 }],
        ["nchar", { length: 10 }],
        ["numeric", { precision: 18, scale: 0 }],
        ["nvarchar", { length: 255 }],
        ["time", { precision: 7 }],
        ["varbinary", { length: 50 }],
        ["varchar", { length: 50 }]
    ]);
    public columnTypeMap = new Map<ColumnTypeMapKey, ColumnType>([
        ["defaultBoolean", "bit"],
        ["defaultBinary", "binary"],
        ["defaultDataString", "xml"],
        ["defaultDate", "datetime"],
        ["defaultDecimal", "decimal"],
        ["defaultEnum", "nvarchar"],
        ["defaultIdentifier", "uniqueidentifier"],
        ["defaultNumberic", "int"],
        ["defaultString", "nvarchar"],
        ["defaultTime", "time"],
        ["defaultRowVersion", "timestamp"]
    ]);
    public valueTypeMap = new Map<GenericType, ColumnType>([
        [TimeSpan, "time"],
        [Date, "datetime"],
        [String, "nvarchar"],
        [Number, "decimal"],
        [Boolean, "bit"]
    ]);
    public resolveTranslator(object: any, memberName?: string) {
        let result = mssqlQueryTranslator.resolve(object, memberName);
        if (!result)
            result = super.resolveTranslator(object, memberName);
        return result;
    }
    public getSelectQuery<T>(select: SelectExpression<T>): IQueryCommand[] {
        let result: IQueryCommand[] = [];
        const skip = select.paging.skip || 0;
        const take = select.paging.take || 0;
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
            selectQuery += this.newLine() + this.getPagingQueryString(select);
        }
        result.push({
            query: selectQuery,
            type: hasIncludes ? "DML" : "DQL"
        });
        // if has other includes, then convert to temp table
        if (hasIncludes) {
            result.push({
                query: "SELECT * FROM " + tempTableName,
                type: "DQL"
            });

            const tempSelect = new SelectExpression(new CustomEntityExpression(tempTableName, select.projectedColumns.select(o => {
                if (o instanceof ComputedColumnExpression)
                    return new ColumnExpression(o.entity, o.type, o.propertyName, o.columnName, o.isPrimary);
                return o;
            }).toArray(), select.itemType, tempTableName.substr(1)));
            // select each include as separated query as it more beneficial for performance
            for (const include of select.includes) {
                // add join to temp table
                const reverseRelation = new Map();
                for (const [key, value] of include.relations) {
                    const tempKey = tempSelect.entity.columns.first(o => o.columnName === key.columnName);
                    reverseRelation.set(value, tempKey);
                }
                const tempJoin = include.child.addJoinRelation(tempSelect, reverseRelation, JoinType.INNER);
                result = result.concat(this.getSelectQuery(include.child));
                include.child.joins.remove(tempJoin);
            }

            result.push({
                query: "DROP TABLE " + tempTableName,
                type: "DDL"
            });
        }
        return result;
    }
    protected getPagingQueryString(select: SelectExpression): string {
        let take = 0, skip = 0;
        if (select.paging.take)
            take = select.paging.take.execute(this.queryVisitor.expressionTransformer);
        if (select.paging.skip)
            skip = select.paging.skip.execute(this.queryVisitor.expressionTransformer);
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

    /**
     * SCHEMA BUILDER QUERY
     */
    public foreignKeyQuery(relation: IRelationMetaData) {
        return `ALTER TABLE ${this.entityName(relation.target)} ADD CONSTRAINT ${this.enclose(relation.fullName)} FOREIGN KEY` +
            ` (${relation.reverseRelation.relationColumns.select(r => r.columnName).toArray().join(",")})` +
            ` REFERENCES ${this.entityName(relation.source)} (${relation.relationColumns.select(r => r.columnName).toArray().join(",")})` +
            ` ON UPDATE ${this.referenceOption(relation.updateOption)} ON DELETE ${this.referenceOption(relation.deleteOption)}`;
    }
    protected referenceOption(option: ReferenceOption) {
        if (option === "RESTRICT")
            return "NO ACTION";
        return option;
    }
    public renameColumnQuery(columnMeta: IColumnMetaData, newName: string): IQueryCommand[] {
        let query = `EXEC sp_rename '${this.entityName(columnMeta.entity)}.${this.enclose(columnMeta.columnName)}', '${newName}', 'COLUMN'`;
        return [{ query, type: "DDL" }];
    }
    public addDefaultContraintQuery(columnMeta: IColumnMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)}` +
            ` ADD DEFAULT ${this.defaultValue(columnMeta)} FOR ${this.enclose(columnMeta.columnName)}`;
        return [{ query, type: "DDL" }];
    }
    public dropIndexQuery(indexMeta: IIndexMetaData): IQueryCommand[] {
        const query = `DROP INDEX ${this.entityName(indexMeta.entity)}.${indexMeta.name}`;
        return [{ query, type: "DDL" }];
    }
    public dropDefaultContraintQuery(columnMeta: IColumnMetaData): IQueryCommand[] {
        const result: IQueryCommand[] = [];
        const variableName = this.newAlias("param");
        result.push({
            query: `DECLARE @${variableName} nvarchar(255) = (` +
                ` SELECT dc.name AS ConstraintName` +
                ` FROM sys.default_constraints dc` +
                ` join sys.columns c on dc.parent_object_id = c.object_id and dc.parent_column_id = c.column_id` +
                ` where SCHEMA_NAME(schema_id) = '${columnMeta.entity.schema}' and OBJECT_NAME(parent_object_id) = '${columnMeta.entity.name}' and c.name = '${columnMeta.columnName}'` +
                ` )`,
            type: "DDL"
        });
        result.push({
            query: `EXEC('ALTER TABLE ${this.entityName(columnMeta.entity)} DROP CONSTRAINT [' + @${variableName} + ']')`,
            type: "DDL"
        });
        return result;
    }
    public dropPrimaryKeyQuery(entityMeta: IEntityMetaData): IQueryCommand[] {
        const result: IQueryCommand[] = [];
        const variableName = this.newAlias("param");
        result.push({
            query: `DECLARE @${variableName} nvarchar(255) = (` +
                ` SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS` +
                ` where CONSTRAINT_TYPE = 'PRIMARY KEY' and TABLE_SCHEMA = '${entityMeta.schema}' and TABLE_NAME = '${entityMeta.name}'` +
                ` )`,
            type: "DDL"
        });
        result.push({
            query: `EXEC('ALTER TABLE ${this.entityName(entityMeta)} DROP CONSTRAINT [' + @${variableName} + ']')`,
            type: "DDL"
        });
        return result;
    }
    public getInsertQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>> | Enumerable<EntityEntry<T>>): IQueryCommand[] {
        const columns = entityMetaData.columns;
        const generatedColumns = columns.where(o => {
            return o.default !== undefined || (o as any as NumericColumnMetaData).autoIncrement;
        });
        const relations = entityMetaData.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one");
        const relationDatas = relations.selectMany(o => o.relationColumns.select(c => ({
            column: c,
            relationProperty: o.propertyName,
            fullName: o.fullName,
            relationColumn: o.relationMaps.get(c)
        })));
        const relationColumns = relationDatas.select(o => o.column);
        const valueColumns = columns.except(relationColumns).where(o => !(o instanceof IdentifierColumnMetaData || (o instanceof NumericColumnMetaData && o.autoIncrement)));
        const columnNames = relationDatas.select(o => o.column).union(valueColumns).select(o => this.enclose(o.columnName)).toArray().join(", ");
        const outputQuery = generatedColumns.select(o => "INSERTED." + this.enclose(o.columnName)).toArray().join(", ");

        const result: IQueryCommand = {
            query: "",
            parameters: {},
            type: "DML"
        };
        result.query = `INSERT INTO ${this.entityName(entityMetaData)}(${columnNames}) ${outputQuery ? "OUTPUT " + outputQuery : ""} VALUES `;

        const getEntryValues = (entry: EntityEntry<T>) => {
            return relationDatas.select(o => {
                // set relation as unchanged (coz already handled here)
                const parentEntity = entry.entity[o.relationProperty] as any;
                if (!parentEntity) {
                    throw new Error(`${o.relationProperty} cannot be null`);
                }

                // TODO: need revisit. coz should not change any state before all data has been saved.
                // Don't set relation entry to unchanged, but filter logic should be implemented on relation add.
                const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                if (parentEntry) {
                    const relationGroup = entry.relationMap[o.fullName];
                    if (relationGroup) {
                        const relationEntry = relationGroup.get(parentEntry.key);
                        if (relationEntry)
                            relationEntry.changeState(EntityState.Unchanged);
                    }
                }

                let paramName = "";
                let value: any = undefined;
                if (parentEntry.state === EntityState.Added) {
                    // if parent entry is added, to used inserted values in case column is auto increment or use default.
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.dbSet.metaData).indexOf(parentEntry);
                    paramName = `__${parentEntry.dbSet.metaData.name}_${o.relationColumn.columnName}_${index}`;
                }
                else {
                    value = parentEntity[o.relationColumn.propertyName];
                    paramName = this.newAlias("param");
                }

                result.parameters[paramName] = value;
                return "@" + paramName;
            }).union(valueColumns.select(o => {
                let value = entry.entity[o.propertyName as keyof T];
                if (value === undefined) {
                    if (o.default)
                        return "DEFAULT";
                    return "NULL";
                }
                else {
                    const paramName = this.newAlias("param");
                    result.parameters[paramName] = value;
                    return "@" + paramName;
                }
            })).toArray().join(",");
        };
        result.query += entries.select(entry => "(" + getEntryValues(entry) + ")").toArray().join(",");
        return [result];
    }
}
