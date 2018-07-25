import { SchemaBuilder } from "../../Data/SchemaBuilder";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { ReferenceOption, QueryType } from "../../Common/Type";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";
import { IIndexMetaData } from "../../MetaData/Interface/IIndexMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";

export class MssqlSchemaBuilder extends SchemaBuilder {
    protected foreignKeyDeclaration(relationMeta: IRelationMetaData) {
        const columns = relationMeta.relationColumns.select(o => this.q.enclose(o.columnName)).toArray().join(", ");
        const referenceColumns = relationMeta.reverseRelation.relationColumns.select(o => this.q.enclose(o.columnName)).toArray().join(", ");
        return `CONSTRAINT ${this.q.enclose(relationMeta.fullName)}` +
            ` FOREIGN KEY (${columns})` +
            ` REFERENCES ${this.q.entityName(relationMeta.target)} (${referenceColumns})` +
            ` ON UPDATE ${this.referenceOption(relationMeta.updateOption)} ON DELETE ${this.referenceOption(relationMeta.deleteOption)}`;
    }
    protected referenceOption(option: ReferenceOption) {
        if (option === "RESTRICT")
            return "NO ACTION";
        return option;
    }
    public renameColumn(columnMeta: IColumnMetaData, newName: string): IQueryCommand[] {
        let query = `EXEC sp_rename '${this.q.entityName(columnMeta.entity)}.${this.q.enclose(columnMeta.columnName)}', '${newName}', 'COLUMN'`;
        return [{ query, type: QueryType.DDL }];
    }
    public addDefaultContraint(columnMeta: IColumnMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.q.entityName(columnMeta.entity)}` +
            ` ADD DEFAULT ${this.defaultValue(columnMeta)} FOR ${this.q.enclose(columnMeta.columnName)}`;
        return [{ query, type: QueryType.DDL }];
    }
    public dropIndex(indexMeta: IIndexMetaData): IQueryCommand[] {
        const query = `DROP INDEX ${this.q.entityName(indexMeta.entity)}.${indexMeta.name}`;
        return [{ query, type: QueryType.DDL }];
    }
    public dropDefaultContraint(columnMeta: IColumnMetaData): IQueryCommand[] {
        const result: IQueryCommand[] = [];
        const variableName = this.q.newAlias("param");
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
            query: `EXEC('ALTER TABLE ${this.q.entityName(columnMeta.entity)} DROP CONSTRAINT [' + @${variableName} + ']')`,
            type: QueryType.DDL
        });
        return result;
    }
    public dropPrimaryKey(entityMeta: IEntityMetaData): IQueryCommand[] {
        const result: IQueryCommand[] = [];
        const variableName = this.q.newAlias("param");
        result.push({
            query: `DECLARE @${variableName} nvarchar(255) = (` +
                ` SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS` +
                ` where CONSTRAINT_TYPE = 'PRIMARY KEY' and TABLE_SCHEMA = '${entityMeta.schema}' and TABLE_NAME = '${entityMeta.name}'` +
                ` )`,
            type: QueryType.DDL
        });
        result.push({
            query: `EXEC('ALTER TABLE ${this.q.entityName(entityMeta)} DROP CONSTRAINT [' + @${variableName} + ']')`,
            type: QueryType.DDL
        });
        return result;
    }
}
