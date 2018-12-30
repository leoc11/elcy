import { SchemaBuilder } from "../../QueryBuilder/SchemaBuilder";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { ReferenceOption, QueryType } from "../../Common/Type";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { IIndexMetaData } from "../../MetaData/Interface/IIndexMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";

export class MssqlSchemaBuilder extends SchemaBuilder {
    protected foreignKeyDeclaration(relationMeta: IRelationMetaData) {
        const columns = relationMeta.relationColumns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(", ");
        const referenceColumns = relationMeta.reverseRelation.relationColumns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(", ");
        let result = `CONSTRAINT ${this.queryBuilder.enclose(relationMeta.fullName)}` +
            ` FOREIGN KEY (${columns})` +
            ` REFERENCES ${this.queryBuilder.entityName(relationMeta.target)} (${referenceColumns})`;

        if (relationMeta.updateOption)
            result += ` ON UPDATE ${this.referenceOption(relationMeta.updateOption)}`;
        if (relationMeta.deleteOption)
            result += ` ON DELETE ${this.referenceOption(relationMeta.deleteOption)}`;

        return result;
    }
    protected referenceOption(option: ReferenceOption) {
        if (option === "RESTRICT")
            return "NO ACTION";
        return option;
    }
    public renameColumn(columnMeta: IColumnMetaData, newName: string): IQuery[] {
        let query = `EXEC sp_rename '${this.queryBuilder.entityName(columnMeta.entity)}.${this.queryBuilder.enclose(columnMeta.columnName)}', '${newName}', 'COLUMN'`;
        return [{ query, type: QueryType.DDL }];
    }
    public addDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.queryBuilder.entityName(columnMeta.entity)}` +
            ` ADD DEFAULT ${this.defaultValue(columnMeta)} FOR ${this.queryBuilder.enclose(columnMeta.columnName)}`;
        return [{ query, type: QueryType.DDL }];
    }
    public dropIndex(indexMeta: IIndexMetaData): IQuery[] {
        const query = `DROP INDEX ${this.queryBuilder.entityName(indexMeta.entity)}.${indexMeta.name}`;
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
            type: QueryType.DDL
        });
        result.push({
            query: `EXEC('ALTER TABLE ${this.queryBuilder.entityName(columnMeta.entity)} DROP CONSTRAINT [' + @${variableName} + ']')`,
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
            query: `EXEC('ALTER TABLE ${this.queryBuilder.entityName(entityMeta)} DROP CONSTRAINT [' + @${variableName} + ']')`,
            type: QueryType.DDL
        });
        return result;
    }
}
