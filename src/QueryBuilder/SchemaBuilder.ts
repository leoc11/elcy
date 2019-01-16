import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { QueryBuilder } from "./QueryBuilder";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { IObjectType, QueryType, ReferenceOption, ValueType } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IConstraintMetaData } from "../MetaData/Interface/IConstraintMetaData";
import { IQuery } from "./Interface/IQuery";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IConnection } from "../Connection/IConnection";
import { StringColumnMetaData } from "../MetaData/StringColumnMetaData";
import { DecimalColumnMetaData } from "../MetaData/DecimalColumnMetaData";
import { IntegerColumnMetaData } from "../MetaData/IntegerColumnMetaData";
import { IIndexMetaData } from "../MetaData/Interface/IIndexMetaData";
import { ICheckConstraintMetaData } from "../MetaData/Interface/ICheckConstraintMetaData";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { ColumnExpression } from "../Queryable/QueryExpression/ColumnExpression";
import { IdentifierColumnMetaData } from "../MetaData/IdentifierColumnMetaData";
import { DateColumnMetaData } from "../MetaData/DateColumnMetaData";
import { TimeColumnMetaData } from "../MetaData/TimeColumnMetaData";
import { RowVersionColumn } from "../Decorator/Column/RowVersionColumn";
import { DataSerializationColumnMetaData } from "../MetaData/DataSerializationColumnMetaData";
import { ColumnType } from "../Common/ColumnType";
import { RowVersionColumnMetaData } from "../MetaData/RowVersionColumnMetaData";
import { EnumColumnMetaData } from "../MetaData/EnumColumnMetaData";
import { BooleanColumnMetaData } from "../MetaData/BooleanColumnMetaData";
import { Enumerable } from "../Enumerable/Enumerable";
import { DateTimeColumnMetaData } from "../MetaData/DateTimeColumnMetaData";
import { BatchedQuery } from "./Interface/BatchedQuery";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { CheckConstraintMetaData } from "../MetaData/CheckConstraintMetaData";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { BinaryColumnMetaData } from "../MetaData/BinaryColumnMetaData";
import { RelationDataMetaData } from "../MetaData/Relation/RelationDataMetaData";

const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
    return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
};
const isIndexEquals = (index1: IIndexMetaData, index2: IIndexMetaData) => {
    return !!index1.unique === !!index2.unique && isColumnsEquals(index1.columns, index1.columns);
};

export abstract class SchemaBuilder {
    constructor(public connection: IConnection, protected readonly queryBuilder: QueryBuilder) {
    }

    public async getSchemaQuery(entityTypes: IObjectType[]) {
        let commitQueries: IQuery[] = [];
        let rollbackQueries: IQuery[] = [];

        const defSchemaResult = (await this.connection.executeQuery({
            query: `SELECT SCHEMA_NAME() AS ${this.queryBuilder.enclose("SCHEMA")}`,
            type: QueryType.DQL
        })).first().rows;
        const defaultSchema = Enumerable.from(defSchemaResult).first()["SCHEMA"];

        const schemas = entityTypes.select(o => Reflect.getOwnMetadata(entityMetaKey, o) as IEntityMetaData<any>).toArray();

        for (const schema of schemas) {
            if (!schema.schema)
                schema.schema = defaultSchema;
        }

        const oldSchemas = await this.loadSchemas(schemas);

        const schemaMaps = schemas.select(o => ({
            schema: o,
            oldSchema: oldSchemas.first(os => os.schema.toLowerCase() === o.schema.toLowerCase() && os.name.toLowerCase() === o.name.toLowerCase())
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
                preRollbackQueries = preRollbackQueries.concat(this.dropAllOldRelations(oldSchema, schema));

                commitQueries = commitQueries.concat(this.updateEntitySchema(schema, oldSchema));
                rollbackQueries = rollbackQueries.concat(this.updateEntitySchema(oldSchema, schema));

                postCommitQueries = postCommitQueries.concat(this.addAllNewRelations(schema, oldSchema));
                postRollbackQueries = postRollbackQueries.concat(this.addAllNewRelations(oldSchema, schema));
            }
            else if (!oldSchema) {
                preRollbackQueries = preRollbackQueries.concat(schema.relations.where(o => !o.isMaster).selectMany(o => this.dropForeignKey(o)).toArray());

                commitQueries = commitQueries.concat(this.createEntitySchema(schema));
                rollbackQueries = rollbackQueries.concat(this.dropTable(schema));

                postCommitQueries = postCommitQueries.concat(schema.relations.where(o => !o.isMaster).selectMany(o => this.addForeignKey(o)).toArray());
            }
            // TODO: handle remove old table?
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

        const schemaDatas = await this.connection.executeQuery(batchedQuery);
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
                column.default = defaultExp;
            }
            if (this.queryBuilder.columnTypesWithOption.contains(column.columnType)) {
                (column as StringColumnMetaData).length = columnSchema["CHARACTER_MAXIMUM_LENGTH"];
                (column as DecimalColumnMetaData).scale = columnSchema["NUMERIC_SCALE"];
                (column as DecimalColumnMetaData).precision = columnSchema["NUMERIC_PRECISION"] || columnSchema["DATETIME_PRECISION"];
            }
            const groupType = this.queryBuilder.supportedColumnTypes.get(column.columnType);
            if (groupType === "Integer") {
                (column as IntegerColumnMetaData).autoIncrement = columnSchema["IS_IDENTITY"];
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
    public createTable<TE>(entityMetaData: IEntityMetaData<TE>, name?: string): IQuery[] {
        const columnDefinitions = entityMetaData.columns.where(o => !!o.columnName).select(o => this.columnDeclaration(o, "create")).toArray().join("," + this.queryBuilder.newLine(1, false));
        const constraints = (entityMetaData.constraints || []).select(o => this.constraintDeclaration(o)).toArray().join("," + this.queryBuilder.newLine(1, false));
        let tableName = this.queryBuilder.entityName(entityMetaData);
        if (name) {
            const oldName = entityMetaData.name;
            entityMetaData.name = name;
            tableName = this.queryBuilder.entityName(entityMetaData);
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
        let query = `EXEC sp_rename '${this.queryBuilder.entityName(entityMetaData)}', '${this.queryBuilder.enclose(newName)}', 'OBJECT'`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropTable<TE>(entityMeta: IEntityMetaData<TE>): IQuery[] {
        const query = `DROP TABLE ${this.queryBuilder.entityName(entityMeta)}`;
        return [{
            query,
            type: QueryType.DDL,
            comment: "You might lost your data"
        }];
    }
    public addColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.queryBuilder.entityName(columnMeta.entity)} ADD ${this.columnDeclaration(columnMeta, "add")}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public renameColumn(columnMeta: IColumnMetaData, newName: string): IQuery[] {
        let query = `EXEC sp_rename '${this.queryBuilder.entityName(columnMeta.entity)}.${this.queryBuilder.enclose(columnMeta.columnName)}', '${newName}', 'COLUMN'`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public alterColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.queryBuilder.entityName(columnMeta.entity)} ALTER COLUMN ${this.columnDeclaration(columnMeta, "alter")}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.queryBuilder.entityName(columnMeta.entity)} DROP COLUMN ${this.queryBuilder.enclose(columnMeta.columnName)}`;
        return [{
            query,
            type: QueryType.DDL,
            comment: "You might lost your data"
        }];
    }
    public addDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.queryBuilder.entityName(columnMeta.entity)} ALTER COLUMN ${this.queryBuilder.enclose(columnMeta.columnName)}` +
            ` SET DEFAULT ${this.defaultValue(columnMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.queryBuilder.entityName(columnMeta.entity)} ALTER COLUMN ${this.queryBuilder.enclose(columnMeta.columnName)}` +
            ` DROP DEFAULT`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropForeignKey(relationMeta: IRelationMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.queryBuilder.entityName(relationMeta.source)} DROP CONSTRAINT ${this.queryBuilder.enclose(relationMeta.fullName)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addForeignKey(relationMeta: IRelationMetaData): IQuery[] {
        const result: IQuery[] = [];
        if (relationMeta.reverseRelation) {
            result.push({
                query: `ALTER TABLE ${this.queryBuilder.entityName(relationMeta.source)} ADD ${this.foreignKeyDeclaration(relationMeta)}`,
                type: QueryType.DDL
            });
        }

        return result;
    }
    public addConstraint(constraintMeta: IConstraintMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.queryBuilder.entityName(constraintMeta.entity)}` +
            ` ADD CONSTRAINT ${this.constraintDeclaration(constraintMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropConstraint(constraintMeta: IConstraintMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.queryBuilder.entityName(constraintMeta.entity)} DROP CONSTRAINT ${this.queryBuilder.enclose(constraintMeta.name)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropPrimaryKey(entityMeta: IEntityMetaData): IQuery[] {
        const pkName = "PK_" + entityMeta.name;
        const query = `ALTER TABLE ${this.queryBuilder.entityName(entityMeta)} DROP CONSTRAINT ${this.queryBuilder.enclose(pkName)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addPrimaryKey(entityMeta: IEntityMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.queryBuilder.entityName(entityMeta)} ADD ${this.primaryKeyDeclaration(entityMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addIndex(indexMeta: IIndexMetaData): IQuery[] {
        const columns = indexMeta.columns.select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(",");
        const query = `CREATE${indexMeta.unique ? " UNIQUE" : ""} INDEX ${indexMeta.name} ON ${this.queryBuilder.entityName(indexMeta.entity)} (${columns})`;
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
            oldColumns.remove(oldCol);
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
            else if (o.oldColumnSchema && !o.oldColumnSchema.default && !o.oldColumnSchema.nullable)
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
            oldIndices.remove(oldIndex);
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
            || this.getColumnType(columnSchema) !== this.getColumnType(oldColumnSchema)
            || (columnSchema.collation && columnSchema.collation !== oldColumnSchema.collation);
        let isDefaultChange = isColumnChange || (columnSchema.default ? this.defaultValue(columnSchema) : null) !== (oldColumnSchema.default ? this.defaultValue(oldColumnSchema) : null);

        if (isDefaultChange && oldColumnSchema.default) {
            result = result.concat(this.dropDefaultContraint(oldColumnSchema));
        }
        if (isNullableChange) {
            if (!columnSchema.nullable && !(oldColumnSchema as any as IntegerColumnMetaData).autoIncrement) {
                // if change from nullable to not nullable, set all existing data to default value.
                const fallbackValue = this.defaultValue(columnSchema);
                result.push({
                    query: `UPDATE ${this.queryBuilder.entityName(entitySchema)} SET ${this.queryBuilder.enclose(columnSchema.columnName)} = ${fallbackValue} WHERE ${this.queryBuilder.enclose(columnSchema.columnName)} IS NULL`,
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
                    query: `SET IDENTITY_INSERT ${this.queryBuilder.entityName(entitySchema)} ON`,
                    type: QueryType.DCL
                });
            }
            // compilation will failed without exec
            result.push({
                query: `EXEC('UPDATE ${this.queryBuilder.entityName(entitySchema)} WITH (HOLDLOCK TABLOCKX) SET ${this.queryBuilder.enclose(cloneColumn.columnName)} = ${this.queryBuilder.enclose(oldColumnSchema.columnName)}')`,
                type: QueryType.DML
            });
            if (toAutoIncrement) {
                result.push({
                    query: `SET IDENTITY_INSERT ${this.queryBuilder.entityName(entitySchema)} OFF`,
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
        if (isDefaultChange && columnSchema.default) {
            result = result.concat(this.addDefaultContraint(columnSchema));
        }

        return result;
    }
    protected columnDeclaration(column: IColumnMetaData | IColumnExpression, type: "alter" | "create" | "add" = "alter") {
        let result = `${this.queryBuilder.enclose(column.columnName)} ${this.getColumnType(column)}`;
        if (column instanceof ColumnExpression && column.columnMetaData) {
            column = column.columnMetaData;
        }
        if ((column as IColumnExpression).isPrimary === undefined) {
            const columnMetaData = column as IColumnMetaData;
            if (type !== "alter") {
                if (columnMetaData.default) {
                    result += ` DEFAULT ${this.defaultValue(columnMetaData)}`;
                }
            }
            if (columnMetaData.collation)
                result += " COLLATE " + columnMetaData.collation;
            if (columnMetaData.nullable !== true)
                result += " NOT NULL";
            if (type !== "alter") {
                if ((columnMetaData as IntegerColumnMetaData).autoIncrement)
                    result += " IDENTITY(1,1)";
            }
            if (type === "create") {
                if (columnMetaData.description)
                    result += " COMMENT " + this.queryBuilder.stringString(columnMetaData.description);
            }
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
    public getColumnType<T>(column: IColumnMetaData<T> | IColumnExpression<T> | ValueType): string {
        if (column instanceof ColumnExpression) {
            const columnExp = column as ColumnExpression;
            if (columnExp.columnType) {
                if (columnExp instanceof ColumnExpression && columnExp.columnMetaData && columnExp.columnType === columnExp.columnMetaData.columnType) {
                    return this.getColumnType(columnExp.columnMetaData);
                }
                return columnExp.columnType;
            }
        }

        let columnOption = column as IColumnMetaData<T>;
        let type: ColumnType;
        if (!(column as IColumnMetaData).columnType) {
            type = this.queryBuilder.valueTypeMap.get(column as any);
        }
        else {
            columnOption = column as IColumnMetaData<T>;
            if (!columnOption.columnType) {
                return this.getColumnType(columnOption.type as any);
            }
            type = columnOption.columnType;
            if (!this.queryBuilder.supportedColumnTypes.has(type)) {
                if (this.queryBuilder.columnTypeMap) {
                    if (this.queryBuilder.columnTypeMap.has(type))
                        type = this.queryBuilder.columnTypeMap.get(type);
                    else if (this.queryBuilder.columnTypeMap.has("defaultBoolean") && columnOption instanceof BooleanColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultBoolean");
                    else if (this.queryBuilder.columnTypeMap.has("defaultString") && columnOption instanceof StringColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultString");
                    else if (this.queryBuilder.columnTypeMap.has("defaultInteger") && columnOption instanceof IntegerColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultInteger");
                    else if (this.queryBuilder.columnTypeMap.has("defaultDecimal") && columnOption instanceof DecimalColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultDecimal");
                    else if (this.queryBuilder.columnTypeMap.has("defaultDateTime") && columnOption instanceof DateTimeColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultDateTime");
                    else if (this.queryBuilder.columnTypeMap.has("defaultIdentifier") && columnOption instanceof IdentifierColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultIdentifier");
                    else if (this.queryBuilder.columnTypeMap.has("defaultDate") && columnOption instanceof DateColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultDate");
                    else if (this.queryBuilder.columnTypeMap.has("defaultEnum") && columnOption instanceof EnumColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultEnum");
                    else if (this.queryBuilder.columnTypeMap.has("defaultRowVersion") && columnOption instanceof RowVersionColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultRowVersion");
                    else if (this.queryBuilder.columnTypeMap.has("defaultTime") && columnOption instanceof TimeColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultTime");
                    else if (this.queryBuilder.columnTypeMap.has("defaultDataSerialization") && columnOption instanceof DataSerializationColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultDataSerialization");
                    else if (this.queryBuilder.columnTypeMap.has("defaultBinary") && columnOption instanceof BinaryColumnMetaData)
                        type = this.queryBuilder.columnTypeMap.get("defaultBinary");
                    else
                        throw new Error(`${type} is not supported`);
                }
            }
        }
        return this.queryBuilder.getColumnType(type, columnOption);
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
            ` REFERENCES ${this.queryBuilder.entityName(relationMeta.target)} (${referenceColumns})`;
        if (relationMeta.updateOption && relationMeta.updateOption !== "NO ACTION")
            result += ` ON UPDATE ${relationMeta.updateOption}`;
        if (relationMeta.deleteOption && relationMeta.deleteOption !== "NO ACTION")
            result += ` ON DELETE ${relationMeta.deleteOption}`;

        return result;
    }
    protected defaultValue(columnMeta: IColumnMetaData) {
        if (columnMeta.default) {
            return this.queryBuilder.getExpressionString(columnMeta.default.body);
        }
        const groupType = this.queryBuilder.supportedColumnTypes.get(columnMeta.columnType);
        if (groupType === "Integer" || groupType === "Decimal" || groupType === "Real" || columnMeta instanceof IntegerColumnMetaData || columnMeta instanceof DecimalColumnMetaData)
            return this.queryBuilder.valueString(0);
        if (groupType === "Identifier" || columnMeta instanceof IdentifierColumnMetaData)
            return "NEWID()";
        if (groupType === "String" || columnMeta instanceof StringColumnMetaData)
            return this.queryBuilder.valueString("");
        if (groupType === "DataSerialization" || columnMeta instanceof DataSerializationColumnMetaData)
            return this.queryBuilder.valueString("{}");
        if (groupType === "Date" || columnMeta instanceof DateColumnMetaData)
            return "GETUTCDATE()";
        if (groupType === "Time" || columnMeta instanceof TimeColumnMetaData)
            return "CONVERT(TIME, GETUTCDATE())";
        if (groupType === "RowVersion" || columnMeta instanceof RowVersionColumn)
            return "CURRENT_TIMESTAMP";
        if (groupType === "Binary" || columnMeta instanceof BinaryColumnMetaData)
            return this.queryBuilder.valueString(new Uint8Array(0));

        throw new Error(`${columnMeta.columnType} not supported`);
    }


    protected rebuildEntitySchema<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>) {
        const columnMetas = schema.columns.select(o => ({
            columnSchema: o,
            oldColumnSchema: oldSchema.columns.first(c => c.columnName === o.columnName)
        }));

        let result: IQuery[] = [];

        const cloneSchema = Object.assign({}, schema);
        cloneSchema.name = "TEMP_" + this.queryBuilder.newAlias();

        result = result.concat(this.createEntitySchema(cloneSchema));

        // turn on identity insert coz rebuild schema most likely called because identity insert issue.
        result.push({
            query: `SET IDENTITY_INSERT ${this.queryBuilder.entityName(cloneSchema)} ON`,
            type: QueryType.DCL
        });

        // copy value
        const newColumns = columnMetas.where(o => !!o.oldColumnSchema).select(o => this.queryBuilder.enclose(o.columnSchema.columnName)).toArray().join(",");
        const copyColumns = columnMetas.where(o => !!o.oldColumnSchema).select(o => this.queryBuilder.enclose(o.oldColumnSchema.columnName)).toArray().join(",");
        result.push({
            query: `INSERT INTO ${this.queryBuilder.entityName(cloneSchema)} (${newColumns}) SELECT ${copyColumns} FROM ${this.queryBuilder.entityName(oldSchema)} WITH (HOLDLOCK TABLOCKX)`,
            type: QueryType.DML
        });

        // turn of identity insert
        result.push({
            query: `SET IDENTITY_INSERT ${this.queryBuilder.entityName(cloneSchema)} OFF`,
            type: QueryType.DCL
        });

        // remove all foreignkey reference to current table
        result = result.concat(this.dropAllMasterRelations(oldSchema));

        // rename temp table
        result = result.concat(this.renameTable(cloneSchema, this.queryBuilder.entityName(schema)));

        // re-add all foreignkey reference to table
        result = result.concat(this.addAllMasterRelations(schema));

        return result;
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
}
