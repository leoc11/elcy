import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { RelationQueryBuilder } from "./RelationQueryBuilder";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IObjectType, QueryType, ReferenceOption } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IConstraintMetaData } from "../../MetaData/Interface/IConstraintMetaData";
import { IQuery } from "../../Query/IQuery";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { IConnection } from "../../Connection/IConnection";
import { StringColumnMetaData } from "../../MetaData/StringColumnMetaData";
import { DecimalColumnMetaData } from "../../MetaData/DecimalColumnMetaData";
import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";
import { IIndexMetaData } from "../../MetaData/Interface/IIndexMetaData";
import { ICheckConstraintMetaData } from "../../MetaData/Interface/ICheckConstraintMetaData";
import { IdentifierColumnMetaData } from "../../MetaData/IdentifierColumnMetaData";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";
import { RowVersionColumn } from "../../Decorator/Column/RowVersionColumn";
import { DataSerializationColumnMetaData } from "../../MetaData/DataSerializationColumnMetaData";
import { ColumnTypeGroup, ColumnTypeMapKey } from "../../Common/ColumnType";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { EnumColumnMetaData } from "../../MetaData/EnumColumnMetaData";
import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { BatchedQuery } from "../../Query/BatchedQuery";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { CheckConstraintMetaData } from "../../MetaData/CheckConstraintMetaData";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { BinaryColumnMetaData } from "../../MetaData/BinaryColumnMetaData";
import { ISchemaBuilder } from "../../Query/ISchemaBuilder";
import { ISchemaQuery } from "../../Query/ISchemaQuery";
import { ISchemaBuilderOption } from "../../Query/ISchemaBuilderOption";
import { RealColumnMetaData } from "../../MetaData/RealColumnMetaData";
import { Uuid } from "../../Data/Uuid";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { clone, isNotNull } from "../../Helper/Util";
import { RelationDataMetaData } from "../../MetaData/Relation/RelationDataMetaData";

const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
    return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
};
const isIndexEquals = (index1: IIndexMetaData, index2: IIndexMetaData) => {
    return !!index1.unique === !!index2.unique && isColumnsEquals(index1.columns, index1.columns);
};

export abstract class RelationSchemaBuilder implements ISchemaBuilder {
    public abstract columnTypeMap: Map<ColumnTypeMapKey, ICompleteColumnType>;
    public connection: IConnection;
    public option: ISchemaBuilderOption = {};
    public readonly queryBuilder: RelationQueryBuilder;
    constructor() {
    }

    public async getSchemaQuery(entityTypes: IObjectType[]): Promise<ISchemaQuery> {
        let commitQueries: IQuery[] = [];
        let rollbackQueries: IQuery[] = [];

        const defSchemaResult = (await this.connection.query({
            query: `SELECT SCHEMA_NAME() AS ${this.queryBuilder.enclose("SCHEMA")}`,
            type: QueryType.DQL
        })).first().rows;
        const defaultSchema = defSchemaResult.first()["SCHEMA"];

        const schemas = entityTypes.select(o => Reflect.getOwnMetadata(entityMetaKey, o) as IEntityMetaData<any>).toArray();

        for (const schema of schemas) {
            if (!schema.schema)
                schema.schema = defaultSchema;
        }

        const oldSchemas = await this.loadSchemas(schemas);
        const schemaMaps = schemas.fullJoin(oldSchemas, (o1, o2) => o1.schema.toLowerCase() === o2.schema.toLowerCase() && o1.name.toLowerCase() === o2.name.toLowerCase(), (o1, o2) => ({
            schema: o1,
            oldSchema: o2
        }));

        let preCommitQueries: IQuery[] = [];
        let preRollbackQueries: IQuery[] = [];

        let postCommitQueries: IQuery[] = [];
        let postRollbackQueries: IQuery[] = [];

        for (const schemaMap of schemaMaps) {
            const schema = schemaMap.schema;
            const oldSchema = schemaMap.oldSchema;
            if (schema && oldSchema) {
                preCommitQueries = preCommitQueries.concat(this.dropAllOldRelations(schema, oldSchema));
                commitQueries = commitQueries.concat(this.updateEntitySchema(schema, oldSchema));
                postCommitQueries = postCommitQueries.concat(this.addAllNewRelations(schema, oldSchema));

                preRollbackQueries = preRollbackQueries.concat(this.dropAllOldRelations(oldSchema, schema));
                rollbackQueries = rollbackQueries.concat(this.updateEntitySchema(oldSchema, schema));
                postRollbackQueries = postRollbackQueries.concat(this.addAllNewRelations(oldSchema, schema));
            }
            else if (!oldSchema) {
                preRollbackQueries = preRollbackQueries.concat(schema.relations.where(o => !o.isMaster).selectMany(o => this.dropForeignKey(o)).toArray());
                rollbackQueries = rollbackQueries.concat(this.dropTable(schema));

                commitQueries = commitQueries.concat(this.createEntitySchema(schema));
                postCommitQueries = postCommitQueries.concat(schema.relations.where(o => !o.isMaster).selectMany(o => this.addForeignKey(o)).toArray());
            }
            else {
                if (this.option.removeUnmappedEntites) {
                    preRollbackQueries = preRollbackQueries.concat(oldSchema.relations.where(o => !o.isMaster).selectMany(o => this.dropForeignKey(o)).toArray());
                    rollbackQueries = rollbackQueries.concat(this.dropTable(oldSchema));

                    commitQueries = commitQueries.concat(this.createEntitySchema(oldSchema));
                    postCommitQueries = postCommitQueries.concat(oldSchema.relations.where(o => !o.isMaster).selectMany(o => this.addForeignKey(o)).toArray());
                }
            }
        }

        return {
            commit: preCommitQueries.concat(commitQueries, postCommitQueries),
            rollback: preRollbackQueries.concat(rollbackQueries, postRollbackQueries)
        };
    }
    public async loadSchemas(entities: IEntityMetaData<any>[]) {
        const schemaGroups = entities.groupBy(o => o.schema).toArray();
        const tableFilters = `TABLE_CATALOG = '${this.connection.database}' AND (${schemaGroups.select(o => `TABLE_SCHEMA = '${o.key}' AND TABLE_NAME IN (${o.select(p => this.queryBuilder.valueString(p.name)).toArray().join(",")})`).toArray().join(") OR (")})`;

        const batchedQuery = new BatchedQuery();
        // table schema
        batchedQuery.add({
            query: `SELECT * FROM ${this.queryBuilder.enclose(this.connection.database)}.INFORMATION_SCHEMA.TABLES WHERE ${tableFilters};`,
            type: QueryType.DQL
        });

        // column schema
        batchedQuery.add({
            query: `SELECT *, CAST(COLUMNPROPERTY(object_id(CONCAT(TABLE_SCHEMA, '.', TABLE_NAME)), COLUMN_NAME, 'IsIdentity') AS BIT) [IS_IDENTITY] FROM ${this.queryBuilder.enclose(this.connection.database)}.INFORMATION_SCHEMA.COLUMNS WHERE ${tableFilters}`,
            type: QueryType.DQL
        });

        batchedQuery.add({
            query: `SELECT a.*, b.CHECK_CLAUSE INTO #tempConstraint FROM ${this.queryBuilder.enclose(this.connection.database)}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS a` +
                ` LEFT JOIN  ${this.queryBuilder.enclose(this.connection.database)}.INFORMATION_SCHEMA.CHECK_CONSTRAINTS b` +
                ` on a.CONSTRAINT_NAME = b.CONSTRAINT_NAME` +
                ` WHERE ${tableFilters}`,
            type: QueryType.DDL | QueryType.DML
        });

        // all table constrains
        batchedQuery.add({
            query: `SELECT * FROM #tempConstraint`,
            type: QueryType.DQL
        });

        // relation constraint for FK
        batchedQuery.add({
            query: `SELECT a.* FROM ${this.queryBuilder.enclose(this.connection.database)}.INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS a` +
                ` JOIN #tempConstraint b ON a.CONSTRAINT_NAME = b.CONSTRAINT_NAME WHERE ${tableFilters}`,
            type: QueryType.DQL
        });

        batchedQuery.add({
            query: `DROP TABLE #tempConstraint`,
            type: QueryType.DDL
        });

        // map constrain to column
        batchedQuery.add({
            query: `SELECT * FROM ${this.queryBuilder.enclose(this.connection.database)}.INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE WHERE ${tableFilters}`,
            type: QueryType.DQL
        });

        // all table index
        batchedQuery.add({
            query: `SELECT s.name [TABLE_SCHEMA], t.name [TABLE_NAME], i.name [INDEX_NAME], i.is_unique [IS_UNIQUE], i.type_desc [TYPE], c.name [COLUMN_NAME]` +
                ` from ${this.queryBuilder.enclose(this.connection.database)}.sys.index_columns ic` +
                ` join ${this.queryBuilder.enclose(this.connection.database)}.sys.columns c on ic.object_id = c.object_id and ic.column_id = c.column_id` +
                ` join ${this.queryBuilder.enclose(this.connection.database)}.sys.indexes i on i.index_id = ic.index_id` +
                ` join ${this.queryBuilder.enclose(this.connection.database)}.sys.tables t on t.object_id = i.object_id` +
                ` join ${this.queryBuilder.enclose(this.connection.database)}.sys.schemas s on t.schema_id = s.schema_id` +
                ` where i.is_primary_key = 0 and i.is_unique_constraint = 0 AND t.is_ms_shipped = 0` +
                ` and (${schemaGroups.select(o => `s.name = '${o.key}' AND t.name IN (${o.select(p => this.queryBuilder.valueString(p.name)).toArray().join(",")})`).toArray().join(") OR (")})` +
                ` order by [TABLE_SCHEMA], [TABLE_NAME], [INDEX_NAME]`,
            type: QueryType.DQL
        });

        const schemaDatas = await this.connection.query(batchedQuery);
        const tableSchemas = schemaDatas[0];
        const columnSchemas = schemaDatas[1];
        const constriantSchemas = schemaDatas[3];
        const constraintColumnSchemas = schemaDatas[6];
        const foreignKeySchemas = schemaDatas[4];
        const indexSchemas = schemaDatas[7];

        // convert all schema to entityMetaData for comparison
        const result: { [key: string]: IEntityMetaData<any> } = {};
        const constraints: { [name: string]: { meta: IConstraintMetaData, type: string } } = {};
        for (const tableSchema of tableSchemas.rows) {
            const entity: IEntityMetaData<any> = {
                schema: tableSchema["TABLE_SCHEMA"],
                name: tableSchema["TABLE_NAME"],
                primaryKeys: [],
                columns: [],
                indices: [],
                constraints: [],
                relations: [],
                type: Object,
                allowInheritance: false,
                inheritance: null
            };
            result[entity.schema + "." + entity.name] = entity;
        }
        for (const columnSchema of columnSchemas.rows) {
            let defaultExpression: string = columnSchema["COLUMN_DEFAULT"];
            const column: IColumnMetaData = {
                columnName: columnSchema["COLUMN_NAME"],
                nullable: columnSchema["IS_NULLABLE"] === "YES",
                columnType: columnSchema["DATA_TYPE"],
                charset: columnSchema["CHARACTER_SET_NAME"],
                collation: columnSchema["COLLATION_NAME"]
            };
            if (defaultExpression) {
                while (defaultExpression[0] === "(" && defaultExpression[defaultExpression.length - 1] === ")")
                    defaultExpression = defaultExpression.substring(1, defaultExpression.length - 1);

                const body = new ValueExpression(undefined, defaultExpression);
                const defaultExp = new FunctionExpression(body, []);
                column.defaultExp = defaultExp;
            }
            const typeMap = this.columnType(column);
            switch (typeMap.group) {
                case "Binary":
                    (column as BinaryColumnMetaData).size = columnSchema["CHARACTER_MAXIMUM_LENGTH"];
                    break;
                case "String":
                    (column as StringColumnMetaData).length = columnSchema["CHARACTER_MAXIMUM_LENGTH"];
                    break;
                case "DateTime":
                case "Time":
                    (column as DateTimeColumnMetaData).precision = columnSchema["DATETIME_PRECISION"];
                    break;
                case "Decimal":
                    (column as DecimalColumnMetaData).scale = columnSchema["NUMERIC_SCALE"];
                    (column as DecimalColumnMetaData).precision = columnSchema["NUMERIC_PRECISION"];
                    break;
                case "Real":
                    (column as RealColumnMetaData).size = columnSchema["NUMERIC_PRECISION"];
                    break;
                case "Integer":
                    // NOTE: work around coz information schema did not contain int storage size (bytes)
                    (column as IntegerColumnMetaData).size = Math.round(columnSchema["NUMERIC_PRECISION"] / 2.5);
                    (column as IntegerColumnMetaData).autoIncrement = columnSchema["IS_IDENTITY"];
                    break;
            }

            const entity = result[columnSchema["TABLE_SCHEMA"] + "." + columnSchema["TABLE_NAME"]];
            column.entity = entity;
            entity.columns.push(column);
        }
        for (const constraint of constriantSchemas.rows) {
            const entity = result[constraint["TABLE_SCHEMA"] + "." + constraint["TABLE_NAME"]];
            const name = constraint["CONSTRAINT_NAME"];
            const type = constraint["CONSTRAINT_TYPE"];
            const columns: IColumnMetaData[] = [];

            let constraintMeta: IConstraintMetaData = {
                name: name,
                entity: entity,
                columns
            };

            if (type === "CHECK") {
                let checkDefinition: string = constraint["CHECK_CLAUSE"];
                const checkExp = new ValueExpression(undefined, checkDefinition);
                constraintMeta = new CheckConstraintMetaData(name, entity, checkExp);
                constraintMeta.columns = columns;
            }
            constraints[name] = {
                meta: constraintMeta,
                type: type
            };
        }
        for (const constraint of constraintColumnSchemas.rows) {
            const entity = result[constraint["TABLE_SCHEMA"] + "." + constraint["TABLE_NAME"]];
            const name = constraint["CONSTRAINT_NAME"];
            const column = constraint["COLUMN_NAME"];

            const constraintData = constraints[name];
            const columnMeta = entity.columns.first(o => o.columnName === column);
            constraintData.meta.columns.push(columnMeta);
            switch (constraintData.type) {
                case "PRIMARY KEY":
                    entity.primaryKeys.push(columnMeta);
                    break;
                case "CHECK":
                case "UNIQUE":
                    entity.constraints.add(constraintData.meta);
                    break;
            }
        }
        for (const relationSchema of foreignKeySchemas.rows) {
            const relationName = relationSchema["CONSTRAINT_NAME"];
            const foreignKey = constraints[relationName];
            const targetConstraint = constraints[relationSchema["UNIQUE_CONSTRAINT_NAME"]];
            const relationType = foreignKey.meta.columns.all(o => foreignKey.meta.entity.primaryKeys.contains(o)) ? "one" : "many";

            const updateOption: ReferenceOption = relationSchema["UPDATE_RULE"];
            const deleteOption: ReferenceOption = relationSchema["DELETE_RULE"];
            const fkRelation: IRelationMetaData = {
                source: foreignKey.meta.entity,
                target: null,
                fullName: relationName,
                relationColumns: foreignKey.meta.columns,
                isMaster: false,
                relationType: relationType,
                relationMaps: new Map(),
                updateOption: updateOption,
                deleteOption: deleteOption
            };
            foreignKey.meta.entity.relations.push(fkRelation);

            if (targetConstraint) {
                fkRelation.target = targetConstraint.meta.entity;
                const reverseFkRelation: IRelationMetaData = {
                    source: targetConstraint.meta.entity,
                    target: foreignKey.meta.entity,
                    fullName: relationName,
                    relationColumns: targetConstraint.meta.columns,
                    isMaster: true,
                    relationType: "one",
                    reverseRelation: fkRelation,
                    relationMaps: new Map()
                };
                fkRelation.reverseRelation = reverseFkRelation;
                // set relationmaps
                for (let i = 0, len = fkRelation.relationColumns.length; i < len; i++) {
                    const fkColumn = fkRelation.relationColumns[i];
                    const masterColumn = reverseFkRelation.relationColumns[i];
                    fkRelation.relationMaps.set(fkColumn, masterColumn);
                    reverseFkRelation.relationMaps.set(masterColumn, fkColumn);
                }
                targetConstraint.meta.entity.relations.push(reverseFkRelation);
            }
        }
        for (const indexSchema of indexSchemas.rows) {
            const entity = result[indexSchema["TABLE_SCHEMA"] + "." + indexSchema["TABLE_NAME"]];
            const indexName = indexSchema["INDEX_NAME"];
            let index = entity.indices.first(o => o.name === indexName);
            if (!index) {
                index = {
                    name: indexName,
                    columns: [],
                    entity: entity,
                    unique: indexSchema["IS_UNIQUE"],
                    // type: indexSchema["TYPE"]
                };
                entity.indices.push(index);
            }
            const column = entity.columns.first(o => o.columnName === indexSchema["COLUMN_NAME"]);
            if (column) index.columns.push(column);
        }

        return Object.keys(result).select(o => result[o]).toArray();
    }
    protected entityName(entityMeta: IEntityMetaData<any>) {
        return `${entityMeta.schema ? this.queryBuilder.enclose(entityMeta.schema) + "." : ""}${this.queryBuilder.enclose(entityMeta.name)}`;
    }
    public createTable<TE>(entityMetaData: IEntityMetaData<TE>, name?: string): IQuery[] {
        const columnDefinitions = entityMetaData.columns.where(o => !!o.columnName).select(o => this.columnDeclaration(o, "create")).toArray().join("," + this.queryBuilder.newLine(1, false));
        const constraints = (entityMetaData.constraints || []).select(o => this.constraintDeclaration(o)).toArray().join("," + this.queryBuilder.newLine(1, false));
        let tableName = this.entityName(entityMetaData);
        if (name) {
            const oldName = entityMetaData.name;
            entityMetaData.name = name;
            tableName = this.entityName(entityMetaData);
            entityMetaData.name = oldName;
        }
        let query = `CREATE TABLE ${tableName}` +
            `${this.queryBuilder.newLine()}(` +
            `${this.queryBuilder.newLine(1, false)}${columnDefinitions}` +
            `,${this.queryBuilder.newLine(1, false)}${this.primaryKeyDeclaration(entityMetaData)}` +
            (constraints ? `,${this.queryBuilder.newLine(1, false)}${constraints}` : "") +
            `${this.queryBuilder.newLine()})`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public renameTable<TE>(entityMetaData: IEntityMetaData<TE>, newName: string): IQuery[] {
        let query = `EXEC sp_rename '${this.entityName(entityMetaData)}', '${this.queryBuilder.enclose(newName)}', 'OBJECT'`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropTable<TE>(entityMeta: IEntityMetaData<TE>): IQuery[] {
        const query = `DROP TABLE ${this.entityName(entityMeta)}`;
        return [{
            query,
            type: QueryType.DDL,
            comment: "You might lost your data"
        }];
    }
    public addColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} ADD ${this.columnDeclaration(columnMeta, "add")}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public renameColumn(columnMeta: IColumnMetaData, newName: string): IQuery[] {
        let query = `EXEC sp_rename '${this.entityName(columnMeta.entity)}.${this.queryBuilder.enclose(columnMeta.columnName)}', '${newName}', 'COLUMN'`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public alterColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} ALTER COLUMN ${this.columnDeclaration(columnMeta, "alter")}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} DROP COLUMN ${this.queryBuilder.enclose(columnMeta.columnName)}`;
        return [{
            query,
            type: QueryType.DDL,
            comment: "You might lost your data"
        }];
    }
    public addDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} ALTER COLUMN ${this.queryBuilder.enclose(columnMeta.columnName)}` +
            ` SET DEFAULT ${this.defaultValue(columnMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} ALTER COLUMN ${this.queryBuilder.enclose(columnMeta.columnName)}` +
            ` DROP DEFAULT`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropForeignKey(relationMeta: IRelationMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.entityName(relationMeta.source)} DROP CONSTRAINT ${this.queryBuilder.enclose(relationMeta.fullName)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addForeignKey(relationMeta: IRelationMetaData): IQuery[] {
        const result: IQuery[] = [];
        if (relationMeta.reverseRelation) {
            result.push({
                query: `ALTER TABLE ${this.entityName(relationMeta.source)} ADD ${this.foreignKeyDeclaration(relationMeta)}`,
                type: QueryType.DDL
            });
        }

        return result;
    }
    public addConstraint(constraintMeta: IConstraintMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.entityName(constraintMeta.entity)}` +
            ` ADD CONSTRAINT ${this.constraintDeclaration(constraintMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropConstraint(constraintMeta: IConstraintMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.entityName(constraintMeta.entity)} DROP CONSTRAINT ${this.queryBuilder.enclose(constraintMeta.name)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropPrimaryKey(entityMeta: IEntityMetaData): IQuery[] {
        const pkName = "PK_" + entityMeta.name;
        const query = `ALTER TABLE ${this.entityName(entityMeta)} DROP CONSTRAINT ${this.queryBuilder.enclose(pkName)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addPrimaryKey(entityMeta: IEntityMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.entityName(entityMeta)} ADD ${this.primaryKeyDeclaration(entityMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addIndex(indexMeta: IIndexMetaData): IQuery[] {
        const columns = indexMeta.columns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(",");
        const query = `CREATE${indexMeta.unique ? " UNIQUE" : ""} INDEX ${indexMeta.name} ON ${this.entityName(indexMeta.entity)} (${columns})`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropIndex(indexMeta: IIndexMetaData): IQuery[] {
        const query = `DROP INDEX ${indexMeta.name}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }

    protected dropAllOldRelations<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>): IQuery[] {
        const isRelationData = schema instanceof RelationDataMetaData || oldSchema instanceof RelationDataMetaData;
        if (isRelationData) {
            // TODO
            return [];
        }
        else {
            const relations = schema.relations.where(o => !o.isMaster).toArray();
            return oldSchema.relations.where(o => !o.isMaster)
                .where(o => !relations.any(or => isColumnsEquals(o.relationColumns, or.relationColumns) && isColumnsEquals(o.reverseRelation.relationColumns, or.reverseRelation.relationColumns)))
                .selectMany(o => this.dropForeignKey(o)).toArray();
        }
    }
    protected addAllNewRelations<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>): IQuery[] {
        const oldRelations = oldSchema.relations.where(o => !o.isMaster).toArray();
        return schema.relations.where(o => !o.isMaster && !!o.reverseRelation)
            .where(o => !oldRelations.any(or => isColumnsEquals(o.relationColumns, or.relationColumns) && isColumnsEquals(o.reverseRelation.relationColumns, or.reverseRelation.relationColumns)))
            .selectMany(o => this.addForeignKey(o)).toArray();
    }
    protected updateEntitySchema<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>) {
        const oldColumns = oldSchema.columns.where(o => !!o.columnName).toArray();
        let columnMetas = schema.columns.where(o => !!o.columnName).select(o => {
            const oldCol = oldColumns.first(c => c.columnName.toLowerCase() === o.columnName.toLowerCase());
            oldColumns.delete(oldCol);
            return {
                columnSchema: o,
                oldColumnSchema: oldCol
            };
        });
        columnMetas = columnMetas.union(oldColumns.select(o => ({
            columnSchema: null,
            oldColumnSchema: o
        })));

        let result = columnMetas.selectMany(o => {
            if (o.columnSchema && o.oldColumnSchema)
                return this.getColumnChanges(o.columnSchema, o.oldColumnSchema);
            else if (o.columnSchema)
                return this.addColumn(o.columnSchema);
            // TODO: add option to always drop column
            else if (o.oldColumnSchema && !o.oldColumnSchema.defaultExp && !o.oldColumnSchema.nullable)
                return this.dropColumn(o.oldColumnSchema);

            return undefined;
        });

        // primary key changes
        if (!isColumnsEquals(schema.primaryKeys, oldSchema.primaryKeys)) {
            result = result.union(this.dropPrimaryKey(oldSchema));
            result = result.union(this.addPrimaryKey(schema));
        }

        const isConstraintEquals = (cons1: IConstraintMetaData, cons2: IConstraintMetaData) => {
            if (cons1 instanceof CheckConstraintMetaData || cons2 instanceof CheckConstraintMetaData) {
                const check1 = cons1 as ICheckConstraintMetaData;
                const check2 = cons2 as ICheckConstraintMetaData;
                const checkDef1 = !check1.definition ? undefined : check1.getDefinitionString(this.queryBuilder);
                const checkDef2 = !check2.definition ? undefined : check2.getDefinitionString(this.queryBuilder);
                return this.normalizeCheckDefinition(checkDef1) === this.normalizeCheckDefinition(checkDef2);
            }

            return isColumnsEquals(cons1.columns, cons2.columns);
        };
        // remove old constraint
        result = result.union(oldSchema.constraints.where(o => !schema.constraints.any(or => isConstraintEquals(o, or)))
            .selectMany(o => this.dropConstraint(o)));
        // add new constraint
        result = result.union(schema.constraints.where(o => !oldSchema.constraints.any(or => isConstraintEquals(o, or)))
            .selectMany(o => this.addConstraint(o)));

        // index
        const oldIndices = oldSchema.indices.slice(0);
        let indexMap = schema.indices.select(o => {
            const oldIndex = oldIndices.first(c => c.name === o.name);
            oldIndices.delete(oldIndex);
            return ({
                index: o,
                oldIndex: oldIndex
            });
        });
        indexMap = indexMap.union(oldIndices.select(o => ({
            index: null,
            oldIndex: o
        })));
        const indicesResults = indexMap.selectMany(o => {
            if (o.index && o.oldIndex) {
                if (!isIndexEquals(o.index, o.oldIndex))
                    return this.dropIndex(o.oldIndex).union(this.addIndex(o.index));
            }
            else if (o.index) {
                return this.addIndex(o.index);
            }
            else if (o.oldIndex) {
                return this.dropIndex(o.oldIndex);
            }
            return [];
        });

        result = result.union(indicesResults);
        return result.toArray();
    }

    protected normalizeCheckDefinition(definition: string) {
        return definition ? ExpressionBuilder.parse(definition).toString() : "";
    }
    protected getColumnChanges<TE>(columnSchema: IColumnMetaData<TE>, oldColumnSchema: IColumnMetaData<TE>) {
        let result: IQuery[] = [];
        const entitySchema = oldColumnSchema.entity;
        // If auto increment, column must be not nullable.
        const isNullableChange = (!!columnSchema.nullable && !(columnSchema as any as IntegerColumnMetaData).autoIncrement) !== (!!oldColumnSchema.nullable && !(oldColumnSchema as any as IntegerColumnMetaData).autoIncrement);
        const isIdentityChange = !!(columnSchema as any as IntegerColumnMetaData).autoIncrement !== !!(oldColumnSchema as any as IntegerColumnMetaData).autoIncrement;
        const isColumnChange = isNullableChange
            || this.queryBuilder.columnTypeString(this.columnType(columnSchema)) !== this.queryBuilder.columnTypeString(this.columnType(oldColumnSchema))
            || (columnSchema.collation && oldColumnSchema.collation && columnSchema.collation !== oldColumnSchema.collation);
        let isDefaultChange = isColumnChange || (columnSchema.defaultExp ? this.defaultValue(columnSchema) : null) !== (oldColumnSchema.defaultExp ? this.defaultValue(oldColumnSchema) : null);

        if (isDefaultChange && oldColumnSchema.defaultExp) {
            result = result.concat(this.dropDefaultContraint(oldColumnSchema));
        }
        if (isNullableChange) {
            if (!columnSchema.nullable && !(oldColumnSchema as any as IntegerColumnMetaData).autoIncrement) {
                // if change from nullable to not nullable, set all existing data to default value.
                const fallbackValue = this.defaultValue(columnSchema);
                result.push({
                    query: `UPDATE ${this.entityName(entitySchema)} SET ${this.queryBuilder.enclose(columnSchema.columnName)} = ${fallbackValue} WHERE ${this.queryBuilder.enclose(columnSchema.columnName)} IS NULL`,
                    type: QueryType.DML
                });
            }
        }
        if (isIdentityChange) {
            const toAutoIncrement = (columnSchema as any as IntegerColumnMetaData).autoIncrement;
            // add new column.
            const newName = "NEW_" + columnSchema.columnName;
            const cloneColumn = Object.assign({}, columnSchema);
            cloneColumn.columnName = newName;
            cloneColumn.entity = oldColumnSchema.entity;

            result = result.concat(this.addColumn(cloneColumn));

            // turn on identity insert coz rebuild schema most likely called because identity insert issue.
            if (toAutoIncrement) {
                result.push({
                    query: `SET IDENTITY_INSERT ${this.entityName(entitySchema)} ON`,
                    type: QueryType.DCL
                });
            }
            // compilation will failed without exec
            result.push({
                query: `EXEC('UPDATE ${this.entityName(entitySchema)} WITH (HOLDLOCK TABLOCKX) SET ${this.queryBuilder.enclose(cloneColumn.columnName)} = ${this.queryBuilder.enclose(oldColumnSchema.columnName)}')`,
                type: QueryType.DML
            });
            if (toAutoIncrement) {
                result.push({
                    query: `SET IDENTITY_INSERT ${this.entityName(entitySchema)} OFF`,
                    type: QueryType.DCL
                });
            }

            // remove old column
            result = result.concat(this.dropColumn(oldColumnSchema));
            // rename temp column
            result = result.concat(this.renameColumn(cloneColumn, columnSchema.columnName));
        }
        else if (isColumnChange) {
            result = result.concat(this.alterColumn(columnSchema));
        }
        if (isDefaultChange && columnSchema.defaultExp) {
            result = result.concat(this.addDefaultContraint(columnSchema));
        }

        return result;
    }
    protected columnDeclaration(columnMeta: IColumnMetaData, type: "alter" | "create" | "add" = "alter") {
        let result = `${this.queryBuilder.enclose(columnMeta.columnName)} ${this.queryBuilder.columnTypeString(this.columnType(columnMeta))}`;
        if (type !== "alter" && columnMeta.defaultExp) {
            result += ` DEFAULT ${this.defaultValue(columnMeta)}`;
        }
        if (columnMeta.collation)
            result += " COLLATE " + columnMeta.collation;
        if (columnMeta.nullable !== true)
            result += " NOT NULL";
        if (type !== "alter" && (columnMeta as IntegerColumnMetaData).autoIncrement) {
            result += " IDENTITY(1,1)";
        }
        if (type === "create" && columnMeta.description) {
            result += " COMMENT " + this.queryBuilder.valueString(columnMeta.description);
        }
        return result;
    }
    protected constraintDeclaration(constraintMeta: IConstraintMetaData) {
        let result = "";
        if ((constraintMeta as ICheckConstraintMetaData).definition) {
            const checkConstriant = constraintMeta as ICheckConstraintMetaData;
            const definition = checkConstriant.getDefinitionString(this.queryBuilder);
            result = `CONSTRAINT ${this.queryBuilder.enclose(constraintMeta.name)} CHECK (${definition})`;
        }
        else {
            const columns = constraintMeta.columns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(",");
            result = `CONSTRAINT ${this.queryBuilder.enclose(constraintMeta.name)} UNIQUE (${columns})`;
        }
        return result;
    }
    protected columnType<T>(column: IColumnMetaData<T>): ICompleteColumnType {
        let columnType: ICompleteColumnType;
        if (this.columnTypeMap.has(column.columnType)) {
            columnType = this.columnTypeMap.get(column.columnType);
        }
        else if (column instanceof BooleanColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultBoolean");
        }
        else if (column instanceof IntegerColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultBoolean");
        }
        else if (column instanceof DecimalColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultBoolean");
        }
        else if (column instanceof DateTimeColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultBoolean");
        }
        else if (column instanceof IdentifierColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultInteger");
        }
        else if (column instanceof DateColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultDate");
        }
        else if (column instanceof EnumColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultEnum");
        }
        else if (column instanceof RowVersionColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultRowVersion");
        }
        else if (column instanceof TimeColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultTime");
        }
        else if (column instanceof DateTimeColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultDateTime");
        }
        else if (column instanceof DataSerializationColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultDataSerialization");
        }
        else if (column instanceof BinaryColumnMetaData) {
            columnType = this.columnTypeMap.get("defaultBinary");
        }

        if (!columnType) {
            throw new Error(`column type '${column.columnType}' is not supported`);
        }

        columnType = clone(columnType, true);
        if (columnType.option) {
            switch (columnType.group) {
                case "Binary": {
                    const size = (column as unknown as BinaryColumnMetaData).size;
                    if (isNotNull(size))
                        columnType.option.size = size;
                    break;
                }
                case "String": {
                    const length = (column as unknown as StringColumnMetaData).length;
                    if (isNotNull(length))
                        columnType.option.length = length;
                    break;
                }
                case "DateTime":
                case "Time": {
                    const precision = (column as unknown as TimeColumnMetaData).precision;
                    if (isNotNull(precision))
                        columnType.option.precision = precision;
                    break;
                }
                case "Decimal": {
                    const scale = (column as unknown as DecimalColumnMetaData).scale;
                    const precision = (column as unknown as DecimalColumnMetaData).precision;
                    if (isNotNull(scale))
                        columnType.option.scale = scale;
                    if (isNotNull(precision))
                        columnType.option.precision = precision;
                    break;
                }
                case "Integer":
                case "Real": {
                    const size = (column as unknown as BinaryColumnMetaData).size;
                    if (isNotNull(size))
                        columnType.option.size = size;
                    break;
                }
            }
        }

        return columnType;
    }
    protected primaryKeyDeclaration(entityMeta: IEntityMetaData) {
        const pkName = "PK_" + entityMeta.name;
        const columnQuery = entityMeta.primaryKeys.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(",");

        return `CONSTRAINT ${this.queryBuilder.enclose(pkName)} PRIMARY KEY (${columnQuery})`;
    }
    protected foreignKeyDeclaration(relationMeta: IRelationMetaData) {
        const columns = relationMeta.relationColumns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(", ");
        const referenceColumns = relationMeta.reverseRelation.relationColumns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(", ");
        let result = `CONSTRAINT ${this.queryBuilder.enclose(relationMeta.fullName)}` +
            ` FOREIGN KEY (${columns})` +
            ` REFERENCES ${this.entityName(relationMeta.target)} (${referenceColumns})`;
        if (relationMeta.updateOption && relationMeta.updateOption !== "NO ACTION")
            result += ` ON UPDATE ${relationMeta.updateOption}`;
        if (relationMeta.deleteOption && relationMeta.deleteOption !== "NO ACTION")
            result += ` ON DELETE ${relationMeta.deleteOption}`;

        return result;
    }
    protected defaultValue(columnMeta: IColumnMetaData) {
        if (columnMeta.defaultExp) {
            return this.queryBuilder.toString(columnMeta.defaultExp.body);
        }
        let groupType: ColumnTypeGroup;
        if (!(columnMeta instanceof ColumnMetaData)) {
            let columnTypeMap = this.columnTypeMap.get(columnMeta.columnType);
            if (columnTypeMap) groupType = columnTypeMap.group;
        }
        if (columnMeta instanceof IntegerColumnMetaData
            || columnMeta instanceof DecimalColumnMetaData
            || columnMeta instanceof RealColumnMetaData
            || groupType === "Integer" || groupType === "Decimal" || groupType === "Real") {
            return this.queryBuilder.valueString(0);
        }
        if (columnMeta instanceof IdentifierColumnMetaData || groupType === "Identifier") {
            return this.queryBuilder.toString(ExpressionBuilder.parse(() => Uuid.new()).body);
        }
        if (columnMeta instanceof StringColumnMetaData
            || columnMeta instanceof DataSerializationColumnMetaData
            || groupType === "String" || groupType === "DataSerialization") {
            return this.queryBuilder.valueString("");
        }
        if (columnMeta instanceof DateColumnMetaData
            || columnMeta instanceof DateTimeColumnMetaData
            || groupType === "Date" || groupType === "DateTime") {
            // Result: GETUTCDATE()
            return this.queryBuilder.toString(ExpressionBuilder.parse(() => Date.utcTimestamp()).body);
        }
        if (columnMeta instanceof TimeColumnMetaData || groupType === "Time") {
            // Result: CONVERT(TIME, GETUTCDATE())
            return this.queryBuilder.toString(ExpressionBuilder.parse(() => Date.utcTimestamp().toTime()).body);
        }
        if (columnMeta instanceof RowVersionColumn || groupType === "RowVersion") {
            // Result: CURRENT_TIMESTAMP;
            return this.queryBuilder.toString(ExpressionBuilder.parse(() => Date.timestamp()).body);
        }
        if (columnMeta instanceof BinaryColumnMetaData || groupType === "Binary") {
            return this.queryBuilder.valueString(new Uint8Array(0));
        }

        throw new Error(`${columnMeta.columnType} not supported`);
    }
    protected dropAllMasterRelations(entityMeta: IEntityMetaData): IQuery[] {
        return entityMeta.relations.where(o => o.isMaster)
            .selectMany(o => this.dropForeignKey(o.reverseRelation)).toArray();
    }
    protected addAllMasterRelations(entityMeta: IEntityMetaData): IQuery[] {
        return entityMeta.relations.where(o => o.isMaster)
            .selectMany(o => this.addForeignKey(o.reverseRelation)).toArray();
    }
    protected createEntitySchema<T>(schema: IEntityMetaData<T>): IQuery[] {
        return this.createTable(schema)
            .union(schema.indices.selectMany(o => this.addIndex(o)))
            .toArray();
    }


    // protected rebuildEntitySchema<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>) {
    //     const columnMetas = schema.columns.select(o => ({
    //         columnSchema: o,
    //         oldColumnSchema: oldSchema.columns.first(c => c.columnName === o.columnName)
    //     }));

    //     let result: IQuery[] = [];

    //     const cloneSchema = Object.assign({}, schema);
    //     cloneSchema.name = "TEMP_" + this.queryBuilder.newAlias();

    //     result = result.concat(this.createEntitySchema(cloneSchema));

    //     // turn on identity insert coz rebuild schema most likely called because identity insert issue.
    //     result.push({
    //         query: `SET IDENTITY_INSERT ${this.entityName(cloneSchema)} ON`,
    //         type: QueryType.DCL
    //     });

    //     // copy value
    //     const newColumns = columnMetas.where(o => !!o.oldColumnSchema).select(o => this.queryBuilder.enclose(o.columnSchema.columnName)).toArray().join(",");
    //     const copyColumns = columnMetas.where(o => !!o.oldColumnSchema).select(o => this.queryBuilder.enclose(o.oldColumnSchema.columnName)).toArray().join(",");
    //     result.push({
    //         query: `INSERT INTO ${this.entityName(cloneSchema)} (${newColumns}) SELECT ${copyColumns} FROM ${this.entityName(oldSchema)} WITH (HOLDLOCK TABLOCKX)`,
    //         type: QueryType.DML
    //     });

    //     // turn of identity insert
    //     result.push({
    //         query: `SET IDENTITY_INSERT ${this.entityName(cloneSchema)} OFF`,
    //         type: QueryType.DCL
    //     });

    //     // remove all foreignkey reference to current table
    //     result = result.concat(this.dropAllMasterRelations(oldSchema));

    //     // rename temp table
    //     result = result.concat(this.renameTable(cloneSchema, this.entityName(schema)));

    //     // re-add all foreignkey reference to table
    //     result = result.concat(this.addAllMasterRelations(schema));

    //     return result;
    // }
}
