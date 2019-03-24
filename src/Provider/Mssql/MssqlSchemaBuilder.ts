import { RelationSchemaBuilder } from "../Relation/RelationSchemaBuilder";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { ReferenceOption, QueryType } from "../../Common/Type";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IQuery } from "../../Query/IQuery";
import { IIndexMetaData } from "../../MetaData/Interface/IIndexMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { ColumnTypeMapKey } from "../../Common/ColumnType";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";
import { isNotNull } from "../../Helper/Util";
import { RealColumnMetaData } from "../../MetaData/RealColumnMetaData";

export class MssqlSchemaBuilder extends RelationSchemaBuilder {
    public columnTypeMap: Map<ColumnTypeMapKey, ICompleteColumnType> = new Map<ColumnTypeMapKey, ICompleteColumnType>([
        ["bigint", { columnType: "bigint", group: "Integer" }],
        ["binary", { columnType: "binary", group: "Binary", option: { size: 50 } }],
        ["bit", { columnType: "bit", group: "Boolean" }],
        ["char", { columnType: "char", group: "String", option: { size: 10 } }],
        ["cursor", { columnType: "cursor", group: "Binary" }],
        ["date", { columnType: "date", group: "Date" }],
        ["datetime", { columnType: "datetime", group: "DateTime" }],
        ["datetime2", { columnType: "datetime2", group: "DateTime", option: { precision: 1 } }],
        ["datetimeoffset", { columnType: "datetimeoffset", group: "Time", option: { precision: 7 } }],
        ["decimal", { columnType: "decimal", group: "Decimal", option: { precision: 18, scale: 0 } }],
        ["float", { columnType: "float", group: "Real", option: { size: 53 } }],
        ["hierarchyid", { columnType: "hierarchyid", group: "Binary" }],
        ["image", { columnType: "image", group: "Binary" }],
        ["int", { columnType: "int", group: "Integer" }],
        ["money", { columnType: "money", group: "Decimal" }],
        ["nchar", { columnType: "nchar", group: "String" }],
        ["ntext", { columnType: "ntext", group: "String" }],
        ["numeric", { columnType: "numeric", group: "Decimal", option: { precision: 18, scale: 0 } }],
        ["nvarchar", { columnType: "nvarchar", group: "String", option: { length: 255 } }],
        ["real", { columnType: "real", group: "Decimal" }],
        ["rowversion", { columnType: "rowversion", group: "RowVersion" }],
        ["timestamp", { columnType: "rowversion", group: "RowVersion" }],
        ["smalldatetime", { columnType: "smalldatetime", group: "Date" }],
        ["smallint", { columnType: "smallint", group: "Integer" }],
        ["smallmoney", { columnType: "smallmoney", group: "Decimal" }],
        ["sql_variant", { columnType: "sql_variant", group: "Binary" }],
        ["table", { columnType: "table", group: "Binary" }],
        ["text", { columnType: "text", group: "String" }],
        ["time", { columnType: "time", group: "Time", option: { precision: 7 } }],
        ["tinyint", { columnType: "tinyint", group: "Integer" }],
        ["uniqueidentifier", { columnType: "uniqueidentifier", group: "Identifier" }],
        ["varchar", { columnType: "varchar", group: "String", option: { length: 50 } }],
        ["varbinary", { columnType: "varbinary", group: "Binary", option: { size: 100 } }],
        ["xml", { columnType: "xml", group: "DataSerialization" }],
        ["defaultBoolean", { columnType: "bit" }],
        ["defaultBinary", { columnType: "binary", option: { size: 50 } }],
        ["defaultDataSerialization", { columnType: "xml" }],
        ["defaultDate", { columnType: "date" }],
        ["defaultDateTime", { columnType: "datetime" }],
        ["defaultTime", { columnType: "time", option: { precision: 7 } }],
        ["defaultDecimal", { columnType: "decimal", option: { precision: 18, scale: 0 } }],
        ["defaultEnum", { columnType: "nvarchar", option: { length: 255 } }],
        ["defaultIdentifier", { columnType: "uniqueidentifier" }],
        ["defaultInteger", { columnType: "int" }],
        ["defaultString", { columnType: "nvarchar", option: { length: 255 } }],
        ["defaultRowVersion", { columnType: "rowversion" }]
    ]);
    protected foreignKeyDeclaration(relationMeta: IRelationMetaData) {
        const columns = relationMeta.relationColumns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(", ");
        const referenceColumns = relationMeta.reverseRelation.relationColumns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(", ");
        let result = `CONSTRAINT ${this.queryBuilder.enclose(relationMeta.fullName)}` +
            ` FOREIGN KEY (${columns})` +
            ` REFERENCES ${this.entityName(relationMeta.target)} (${referenceColumns})`;

        const updateOption = this.referenceOption(relationMeta.updateOption);
        const deleteOption = this.referenceOption(relationMeta.deleteOption);
        if (updateOption && updateOption !== "NO ACTION")
            result += ` ON UPDATE ${updateOption}`;
        if (deleteOption && deleteOption !== "NO ACTION")
            result += ` ON DELETE ${deleteOption}`;

        return result;
    }
    protected referenceOption(option: ReferenceOption) {
        if (option === "RESTRICT")
            return "NO ACTION";
        return option;
    }
    public renameColumn(columnMeta: IColumnMetaData, newName: string): IQuery[] {
        let query = `EXEC sp_rename '${this.entityName(columnMeta.entity)}.${this.queryBuilder.enclose(columnMeta.columnName)}', '${newName}', 'COLUMN'`;
        return [{ query, type: QueryType.DDL }];
    }
    public addDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)}` +
            ` ADD DEFAULT ${this.defaultValue(columnMeta)} FOR ${this.queryBuilder.enclose(columnMeta.columnName)}`;
        return [{ query, type: QueryType.DDL }];
    }
    public dropIndex(indexMeta: IIndexMetaData): IQuery[] {
        const query = `DROP INDEX ${this.entityName(indexMeta.entity)}.${indexMeta.name}`;
        return [{ query, type: QueryType.DDL }];
    }
    public dropDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        const result: IQuery[] = [];
        const variableName = this.queryBuilder.newAlias("param");
        result.push({
            query: `DECLARE @${variableName} nvarchar(255) = (` +
                ` SELECT dc.name AS ConstraintName` +
                ` FROM sys.default_constraints dc` +
                ` join sys.columns c on dc.parent_object_id = c.object_id and dc.parent_column_id = c.column_id` +
                ` where SCHEMA_NAME(schema_id) = '${columnMeta.entity.schema}' and OBJECT_NAME(parent_object_id) = '${columnMeta.entity.name}' and c.name = '${columnMeta.columnName}'` +
                ` )`,
            type: QueryType.DQL
        });
        result.push({
            query: `EXEC('ALTER TABLE ${this.entityName(columnMeta.entity)} DROP CONSTRAINT [' + @${variableName} + ']')`,
            type: QueryType.DDL
        });
        return result;
    }
    public dropPrimaryKey(entityMeta: IEntityMetaData): IQuery[] {
        const result: IQuery[] = [];
        const variableName = this.queryBuilder.newAlias("param");
        result.push({
            query: `DECLARE @${variableName} nvarchar(255) = (` +
                ` SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS` +
                ` where CONSTRAINT_TYPE = 'PRIMARY KEY' and TABLE_SCHEMA = '${entityMeta.schema}' and TABLE_NAME = '${entityMeta.name}'` +
                ` )`,
            type: QueryType.DDL
        });
        result.push({
            query: `EXEC('ALTER TABLE ${this.entityName(entityMeta)} DROP CONSTRAINT [' + @${variableName} + ']')`,
            type: QueryType.DDL
        });
        return result;
    }
    protected columnType<T>(column: IColumnMetaData<T>): ICompleteColumnType {
        const columnType = super.columnType(column);
        switch (columnType.group) {
            case "Integer": {
                const size = (column as unknown as IntegerColumnMetaData).size;
                if (isNotNull(size)) {
                    if (size > 4)
                        columnType.columnType = "bigint";
                    else if (size > 2)
                        columnType.columnType = "int";
                    else if (size > 1)
                        columnType.columnType = "smallint";
                    else
                        columnType.columnType = "tinyint";
                }
                break;
            }
            case "Real": {
                switch (columnType.columnType) {
                    case "float": {
                        const size = (column as unknown as RealColumnMetaData).size;
                        if (isNotNull(size)) {
                            columnType.option.size = size <= 24 ? 24 : 53;
                        }
                    }
                }
                break;
            }
        }
        return columnType;
    }
}
