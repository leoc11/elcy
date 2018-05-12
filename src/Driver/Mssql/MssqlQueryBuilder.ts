import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../../Common/ColumnType";
import { IColumnTypeDefaults } from "../../Common/IColumnTypeDefaults";
import { GenericType, ReferenceOption } from "../../Common/Type";
import { TimeSpan } from "../../Common/TimeSpan";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IIndexMetaData } from "../../MetaData/Interface/IIndexMetaData";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";

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
        ["defaultTimestamp", "timestamp"]
    ]);
    public valueTypeMap = new Map<GenericType, ColumnType>([
        [TimeSpan, "time"],
        [Date, "datetime"],
        [String, "nvarchar"],
        [Number, "decimal"],
        [Boolean, "bit"]
    ]);
    protected getPagingQueryString(select: SelectExpression): string {
        const skip = select.paging.skip || 0;
        const take = select.paging.take || 0;
        let result = "";
        if (select.orders.length <= 0)
            result += "ORDER BY (SELECT NULL)" + this.newLine();
        result += "OFFSET " + skip + " ROWS";
        if (take > 0)
            result += this.newLine() + "FETCH NEXT " + take + " ROWS ONLY";
        return result;
    }

    /**
     * SCHEMA BUILDER QUERY
     */
    public foreignKeyQuery(relation: IRelationMetaData) {
        return `ALTER TABLE ${this.entityName(relation.target)} ADD CONSTRAINT ${this.enclose(relation.name)} FOREIGN KEY` +
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
        return [{ query }];
    }
    public addDefaultContraintQuery(columnMeta: IColumnMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)}` +
            ` ADD DEFAULT ${this.defaultValue(columnMeta)} FOR ${this.enclose(columnMeta.columnName)}`;
        return [{ query }];
    }
    public dropIndexQuery(indexMeta: IIndexMetaData): IQueryCommand[] {
        const query = `DROP INDEX ${this.entityName(indexMeta.entity)}.${indexMeta.name}`;
        return [{ query }];
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
                ` )`
        });
        result.push({
            query: `EXEC('ALTER TABLE ${this.entityName(columnMeta.entity)} DROP CONSTRAINT [' + @${variableName} + ']')`
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
                ` )`
        });
        result.push({
            query: `EXEC('ALTER TABLE ${this.entityName(entityMeta)} DROP CONSTRAINT [' + @${variableName} + ']')`
        });
        return result;
    }
}
