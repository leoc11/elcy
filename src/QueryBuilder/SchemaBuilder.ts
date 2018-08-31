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
import { NumericColumnMetaData } from "../MetaData/NumericColumnMetaData";
import { IIndexMetaData } from "../MetaData/Interface/IIndexMetaData";
import { ICheckConstraintMetaData } from "../MetaData/Interface/ICheckConstraintMetaData";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { ColumnExpression } from "../Queryable/QueryExpression/ColumnExpression";
import { IdentifierColumnMetaData } from "../MetaData/IdentifierColumnMetaData";
import { DateColumnMetaData } from "../MetaData/DateColumnMetaData";
import { TimeColumnMetaData } from "../MetaData/TimeColumnMetaData";
import { RowVersionColumn } from "../Decorator/Column/RowVersionColumn";
import { StringDataColumnMetaData } from "../MetaData/DataStringColumnMetaData";
import { ColumnType } from "../Common/ColumnType";
import { RowVersionColumnMetaData } from "../MetaData/RowVersionColumnMetaData";
import { EnumColumnMetaData } from "../MetaData/EnumColumnMetaData";
import { BooleanColumnMetaData } from "../MetaData/BooleanColumnMetaData";
import { Enumerable } from "../Enumerable/Enumerable";
import { DateTimeColumnMetaData } from "../MetaData/DateTimeColumnMetaData";

export abstract class SchemaBuilder {
    constructor(public connection: IConnection, public q: QueryBuilder) { }
    public async getSchemaQuery(entityTypes: IObjectType[]) {
        let commitQueries: IQuery[] = [];
        let rollbackQueries: IQuery[] = [];

        const defSchemaResult = (await this.connection.executeQuery({
            query: `SELECT SCHEMA_NAME() AS ${this.q.enclose("SCHEMA")}`,
            type: QueryType.DQL
        })).first().rows;
        const defaultSchema = Enumerable.load(defSchemaResult).first()["SCHEMA"];

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
                preRollbackQueries = preRollbackQueries.concat(schema.relations.selectMany(o => this.dropForeignKey(o)).toArray());

                commitQueries = commitQueries.concat(this.createEntitySchema(schema));
                rollbackQueries = rollbackQueries.concat(this.dropTable(schema));

                postCommitQueries = postCommitQueries.concat(schema.relations.selectMany(o => this.addForeignKey(o)).toArray());
            }
        }

        return {
            commit: preCommitQueries.concat(commitQueries, postCommitQueries),
            rollback: preRollbackQueries.concat(rollbackQueries, postRollbackQueries)
        };
    }
    public async loadSchemas(entities: IEntityMetaData<any>[]) {
        const schemaGroups = entities.groupBy(o => o.schema).toArray();
        const tableFilters = `TABLE_CATALOG = '${this.connection.database}' AND ((${schemaGroups.select(o => `TABLE_SCHEMA = '${o.key}' AND TABLE_NAME IN (${o.select(p => this.q.getValueString(p.name)).toArray().join(",")})`).toArray().join(") OR (")}))`;
        const queries =
            // table schema
            `SELECT * FROM ${this.q.enclose(this.connection.database)}.INFORMATION_SCHEMA.TABLES WHERE ${tableFilters};` +

            // column schema
            `SELECT *, CAST(COLUMNPROPERTY(object_id(CONCAT(TABLE_SCHEMA, '.', TABLE_NAME)), COLUMN_NAME, 'IsIdentity') AS BIT) [IS_IDENTITY] FROM ${this.q.enclose(this.connection.database)}.INFORMATION_SCHEMA.COLUMNS WHERE ${tableFilters};` +

            // all table constrains
            `SELECT a.*, b.CHECK_CLAUSE INTO #tempConstraint FROM ${this.q.enclose(this.connection.database)}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS a` +
            ` LEFT JOIN  ${this.q.enclose(this.connection.database)}.INFORMATION_SCHEMA.CHECK_CONSTRAINTS b` +
            ` on a.CONSTRAINT_NAME = b.CONSTRAINT_NAME` +
            ` WHERE ${tableFilters};` +
            `SELECT * FROM #tempConstraint;` +

            // relation constraint for FK
            `SELECT a.* FROM ${this.q.enclose(this.connection.database)}.INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS a` +
            ` JOIN #tempConstraint b ON a.CONSTRAINT_NAME = b.CONSTRAINT_NAME WHERE ${tableFilters};` +
            `DROP TABLE #tempConstraint;` +

            // map constrain to column
            `SELECT * FROM ${this.q.enclose(this.connection.database)}.INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE WHERE ${tableFilters};` +

            // all table index
            `SELECT s.name [TABLE_SCHEMA], t.name [TABLE_NAME], i.name [INDEX_NAME], i.is_unique [IS_UNIQUE], i.type_desc [TYPE], c.name [COLUMN_NAME]` +
            ` from ${this.q.enclose(this.connection.database)}.sys.index_columns ic` +
            ` join ${this.q.enclose(this.connection.database)}.sys.columns c on ic.object_id = c.object_id and ic.column_id = c.column_id` +
            ` join ${this.q.enclose(this.connection.database)}.sys.indexes i on i.index_id = ic.index_id` +
            ` join ${this.q.enclose(this.connection.database)}.sys.tables t on t.object_id = i.object_id` +
            ` join ${this.q.enclose(this.connection.database)}.sys.schemas s on t.schema_id = s.schema_id` +
            ` where i.is_primary_key = 0 and i.is_unique_constraint = 0 AND t.is_ms_shipped = 0` +
            ` order by [TABLE_SCHEMA], [TABLE_NAME], [INDEX_NAME]`;

        const schemaDatas = await this.connection.executeQuery({
            query: queries,
            type: QueryType.DQL
        });
        const tableSchemas = schemaDatas[0];
        const columnSchemas = schemaDatas[1];
        const constriantSchemas = schemaDatas[2];
        const constraintColumnSchemas = schemaDatas[4];
        const foreignKeySchemas = schemaDatas[3];
        const indexSchemas = schemaDatas[5];

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
                computedProperties: [],
                inheritance: null
            };
            result[entity.schema + "." + entity.name] = entity;
        }
        for (const columnSchema of columnSchemas.rows) {
            const defaultExpression: string = columnSchema["COLUMN_DEFAULT"];
            const column: IColumnMetaData = {
                columnName: columnSchema["COLUMN_NAME"],
                nullable: columnSchema["IS_NULLABLE"] === "YES",
                columnType: columnSchema["DATA_TYPE"],
                charset: columnSchema["CHARACTER_SET_NAME"],
                collation: columnSchema["COLLATION_NAME"]
            };
            if (defaultExpression) {
                const defaultExp = new FunctionExpression(null, []);
                const defaultString = defaultExpression.substring(1, defaultExpression.length - 1);
                defaultExp.toString = () => defaultString;
                column.default = defaultExp;
            }
            if (this.q.columnTypesWithOption.contains(column.columnType)) {
                (column as StringColumnMetaData).length = columnSchema["CHARACTER_MAXIMUM_LENGTH"];
                (column as DecimalColumnMetaData).scale = columnSchema["NUMERIC_SCALE"];
                (column as DecimalColumnMetaData).precision = columnSchema["NUMERIC_PRECISION"] || columnSchema["DATETIME_PRECISION"];
            }
            const groupType = this.q.supportedColumnTypes.get(column.columnType);
            if (groupType === "Numeric") {
                (column as NumericColumnMetaData).autoIncrement = columnSchema["IS_IDENTITY"];
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

            const constraintMeta: IConstraintMetaData = {
                name: name,
                entity: entity,
                columns
            };

            if (type === "CHECK") {
                (constraintMeta as any).checkDefinition = constraint["CHECK_CLAUSE"];
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
                    entity.constraints.push(constraintData.meta);
                    break;
                case "UNIQUE":
                    entity.constraints.push(constraintData.meta);
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
                target: targetConstraint.meta.entity,
                fullName: relationName,
                relationColumns: foreignKey.meta.columns,
                isMaster: false,
                relationType: relationType,
                relationMaps: new Map(),
                updateOption: updateOption,
                deleteOption: deleteOption
            };
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
            const l = fkRelation.relationColumns.length;
            for (let i = 0; i < l; i++) {
                const fkColumn = fkRelation.relationColumns[i];
                const masterColumn = reverseFkRelation.relationColumns[i];
                fkRelation.relationMaps.set(fkColumn, masterColumn);
                reverseFkRelation.relationMaps.set(masterColumn, fkColumn);
            }

            foreignKey.meta.entity.relations.push(fkRelation);
            targetConstraint.meta.entity.relations.push(reverseFkRelation);
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
                    type: indexSchema["TYPE"]
                };
                entity.indices.push(index);
            }
            const column = entity.columns.first(o => o.columnName === indexSchema["COLUMN_NAME"]);
            index.columns.push(column);
        }

        return Object.keys(result).select(o => result[o]).toArray();
    }
    public createTable<TE>(entityMetaData: IEntityMetaData<TE>, name?: string): IQuery[] {
        const columnDefinitions = entityMetaData.columns.select(o => this.columnDeclaration(o, "create")).toArray().join("," + this.q.newLine(1, false));
        const constraints = (entityMetaData.constraints || []).select(o => this.constraintDeclaration(o)).toArray().join("," + this.q.newLine(1, false));
        let tableName = this.q.entityName(entityMetaData);
        if (name) {
            const oldName = entityMetaData.name;
            entityMetaData.name = name;
            tableName = this.q.entityName(entityMetaData);
            entityMetaData.name = oldName;
        }

        let query = `CREATE TABLE ${tableName}` +
            `${this.q.newLine()}(` +
            `${this.q.newLine(1, false)}${columnDefinitions}` +
            `,${this.q.newLine(1, false)}${this.primaryKeyDeclaration(entityMetaData)}` +
            (constraints ? `,${this.q.newLine(1, false)}${constraints}` : "") +
            `${this.q.newLine()})`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public renameTable<TE>(entityMetaData: IEntityMetaData<TE>, newName: string): IQuery[] {
        let query = `EXEC sp_rename '${this.q.entityName(entityMetaData)}', '${this.q.enclose(newName)}', 'OBJECT'`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropTable<TE>(entityMeta: IEntityMetaData<TE>): IQuery[] {
        const query = `DROP TABLE ${this.q.entityName(entityMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.q.entityName(columnMeta.entity)} ADD ${this.columnDeclaration(columnMeta, "add")}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public renameColumn(columnMeta: IColumnMetaData, newName: string): IQuery[] {
        let query = `EXEC sp_rename '${this.q.entityName(columnMeta.entity)}.${this.q.enclose(columnMeta.columnName)}', '${newName}', 'COLUMN'`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public alterColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.q.entityName(columnMeta.entity)} ALTER COLUMN ${this.columnDeclaration(columnMeta, "alter")}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropColumn(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.q.entityName(columnMeta.entity)} DROP COLUMN ${this.q.enclose(columnMeta.columnName)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.q.entityName(columnMeta.entity)} ALTER COLUMN ${this.q.enclose(columnMeta.columnName)}` +
            ` SET DEFAULT ${this.defaultValue(columnMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropDefaultContraint(columnMeta: IColumnMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.q.entityName(columnMeta.entity)} ALTER COLUMN ${this.q.enclose(columnMeta.columnName)}` +
            ` DROP DEFAULT`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropForeignKey(relationMeta: IRelationMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.q.entityName(relationMeta.source)} DROP CONSTRAINT ${this.q.enclose(relationMeta.fullName)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addForeignKey(relationMeta: IRelationMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.q.entityName(relationMeta.source)} ADD ${this.foreignKeyDeclaration(relationMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addConstraint(constraintMeta: IConstraintMetaData): IQuery[] {
        let query = `ALTER TABLE ${this.q.entityName(constraintMeta.entity)}` +
            ` ADD CONSTRAINT ${this.constraintDeclaration(constraintMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropConstraint(constraintMeta: IConstraintMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.q.entityName(constraintMeta.entity)} DROP CONSTRAINT ${this.q.enclose(constraintMeta.name)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public dropPrimaryKey(entityMeta: IEntityMetaData): IQuery[] {
        const pkName = "PK_" + entityMeta.name;
        const query = `ALTER TABLE ${this.q.entityName(entityMeta)} DROP CONSTRAINT ${this.q.enclose(pkName)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addPrimaryKey(entityMeta: IEntityMetaData): IQuery[] {
        const query = `ALTER TABLE ${this.q.entityName(entityMeta)} ADD ${this.primaryKeyDeclaration(entityMeta)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public addIndex(indexMeta: IIndexMetaData): IQuery[] {
        const columns = indexMeta.columns.select(o => this.q.enclose(o.columnName)).toArray().join(",");
        const query = `CREATE${indexMeta.unique ? " UNIQUE" : ""} INDEX ${indexMeta.name} ON ${this.q.entityName(indexMeta.entity)} (${columns})`;
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
        const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
            return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
        };

        const relations = schema.relations.slice(0);
        return oldSchema.relations.where(o => !relations.any(or => isColumnsEquals(o.relationColumns, or.relationColumns)))
            .selectMany(o => this.dropForeignKey(o)).toArray();
    }
    protected addAllNewRelations<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>): IQuery[] {
        const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
            return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
        };

        const oldRelations = oldSchema.relations.slice(0);
        return schema.relations.where(o => !oldRelations.any(or => isColumnsEquals(o.relationColumns, or.relationColumns)))
            .selectMany(o => this.addForeignKey(o)).toArray();
    }
    protected updateEntitySchema<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>) {
        let result: IQuery[] = [];
        const columnMetas = schema.columns.select(o => ({
            columnSchema: o,
            oldColumnSchema: oldSchema.columns.first(c => c.columnName.toLowerCase() === o.columnName.toLowerCase())
        }));

        result = columnMetas.selectMany(o => this.getColumnChanges(o.columnSchema, o.oldColumnSchema)).toArray();

        const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
            return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
        };
        // primary key changes
        if (!isColumnsEquals(schema.primaryKeys, oldSchema.primaryKeys)) {
            result = result.concat(this.dropPrimaryKey(oldSchema));
            result = result.concat(this.addPrimaryKey(schema));
        }

        const isConstraintEquals = (cons1: IConstraintMetaData, cons2: IConstraintMetaData) => {
            const check1 = cons1 as ICheckConstraintMetaData;
            const check2 = cons2 as ICheckConstraintMetaData;
            const checkDef1 = !check1.definition ? undefined : check1.definition instanceof FunctionExpression ? this.q.getExpressionString(check1.definition) : check1.definition;
            const checkDef2 = !check2.definition ? undefined : check2.definition instanceof FunctionExpression ? this.q.getExpressionString(check2.definition) : check2.definition;
            return checkDef1 === checkDef2 && isColumnsEquals(cons1.columns, cons2.columns);
        };
        // remove old constraint
        result = result.concat(oldSchema.constraints.where(o => !schema.constraints.any(or => isConstraintEquals(o, or)))
            .selectMany(o => this.dropConstraint(o)).toArray());
        // add new constraint
        result = result.concat(schema.constraints.where(o => !oldSchema.constraints.any(or => isConstraintEquals(o, or)))
            .selectMany(o => this.addConstraint(o)).toArray());

        const isIndexEquals = (index1: IIndexMetaData, index2: IIndexMetaData) => {
            return !!index1.unique === !!index2.unique && index1.type === index2.type && isColumnsEquals(index1.columns, index1.columns);
        };

        // index
        const oldIndices = oldSchema.indices.slice(0);
        const indexMap = schema.indices.select(o => ({
            index: o,
            oldIndex: oldIndices.first(c => c.name === o.name)
        }));

        // modify old index by drop and add index with newer definition
        result = result.concat(indexMap.where(o => o.oldIndex && !isIndexEquals(o.index, o.oldIndex)).selectMany(o => {
            oldIndices.remove(o.oldIndex);
            return this.dropIndex(o.oldIndex).concat(this.addIndex(o.index));
        }).toArray());

        // add new index
        result = result.concat(indexMap.where(o => !o.oldIndex && !oldIndices.any(oi => isIndexEquals(o.index, oi)))
            .selectMany(o => this.addIndex(o.index)).toArray());

        return result;
    }
    protected getColumnChanges<TE>(columnSchema: IColumnMetaData<TE>, oldColumnSchema: IColumnMetaData<TE>) {
        let result: IQuery[] = [];
        const entitySchema = oldColumnSchema.entity;
        // If auto increment, column must be not nullable.
        const isNullableChange = (!!columnSchema.nullable && !(columnSchema as any as NumericColumnMetaData).autoIncrement) !== (!!oldColumnSchema.nullable && !(oldColumnSchema as any as NumericColumnMetaData).autoIncrement);
        let isDefaultChange = (columnSchema.default ? this.defaultValue(columnSchema) : null) !== (oldColumnSchema.default ? this.defaultValue(oldColumnSchema) : null);
        const isIdentityChange = !!(columnSchema as any as NumericColumnMetaData).autoIncrement !== !!(oldColumnSchema as any as NumericColumnMetaData).autoIncrement;
        const isColumnChange = isNullableChange || columnSchema.columnType !== columnSchema.columnType
            || (columnSchema.collation && columnSchema.collation !== columnSchema.collation)
            || ((columnSchema as any as NumericColumnMetaData).length !== undefined && (oldColumnSchema as any as NumericColumnMetaData).length !== undefined && (columnSchema as any as NumericColumnMetaData).length !== (oldColumnSchema as any as NumericColumnMetaData).length)
            || ((columnSchema as DecimalColumnMetaData).precision !== undefined && (oldColumnSchema as DecimalColumnMetaData).precision !== undefined && (columnSchema as DecimalColumnMetaData).precision !== (oldColumnSchema as DecimalColumnMetaData).precision)
            || ((columnSchema as DecimalColumnMetaData).scale !== undefined && (oldColumnSchema as DecimalColumnMetaData).scale !== undefined && (columnSchema as DecimalColumnMetaData).scale !== (oldColumnSchema as DecimalColumnMetaData).scale);

        if (isDefaultChange && oldColumnSchema.default) {
            result = result.concat(this.dropDefaultContraint(oldColumnSchema));
        }
        if (isNullableChange) {
            if (!columnSchema.nullable && !(oldColumnSchema as any as NumericColumnMetaData).autoIncrement) {
                // if change from nullable to not nullable, set all existing data to default value.
                const fallbackValue = this.defaultValue(columnSchema);
                result.push({
                    query: `UPDATE ${this.q.entityName(entitySchema)} SET ${this.q.enclose(columnSchema.columnName)} = ${fallbackValue} WHERE ${this.q.enclose(columnSchema.columnName)} IS NULL`,
                    type: QueryType.DML
                });
            }
        }
        if (isIdentityChange) {
            const toAutoIncrement = (columnSchema as any as NumericColumnMetaData).autoIncrement;
            // add new column.
            const newName = "NEW_" + columnSchema.columnName;
            const cloneColumn = Object.assign({}, columnSchema);
            cloneColumn.columnName = newName;
            cloneColumn.entity = oldColumnSchema.entity;

            result = result.concat(this.addColumn(cloneColumn));

            // turn on identity insert coz rebuild schema most likely called because identity insert issue.
            if (toAutoIncrement) {
                result.push({
                    query: `SET IDENTITY_INSERT ${this.q.entityName(entitySchema)} ON`,
                    type: QueryType.DCL
                });
            }
            // compilation will failed without exec
            result.push({
                query: `EXEC('UPDATE ${this.q.entityName(entitySchema)} WITH (HOLDLOCK TABLOCKX) SET ${this.q.enclose(cloneColumn.columnName)} = ${this.q.enclose(oldColumnSchema.columnName)}')`,
                type: QueryType.DML
            });
            if (toAutoIncrement) {
                result.push({
                    query: `SET IDENTITY_INSERT ${this.q.entityName(entitySchema)} OFF`,
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
        let result = `${this.q.enclose(column.columnName)} ${this.getColumnType(column)}`;
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
            if (columnMetaData.nullable === false)
                result += " NOT NULL";
            if (type !== "alter") {
                if ((columnMetaData as NumericColumnMetaData).autoIncrement)
                    result += " IDENTITY(1,1)";
            }
            if (type === "create") {
                if (columnMetaData.description)
                    result += " COMMENT " + this.q.getString(columnMetaData.description);
            }
        }
        return result;
    }
    protected constraintDeclaration(constraintMeta: IConstraintMetaData) {
        let result = "";
        if ((constraintMeta as ICheckConstraintMetaData).definition) {
            const checkConstriant = constraintMeta as ICheckConstraintMetaData;
            const definition = checkConstriant.definition instanceof FunctionExpression ? this.q.getExpressionString(checkConstriant.definition) : checkConstriant.definition;
            result = `CONSTRAINT ${this.q.enclose(constraintMeta.name)} CHECK (${definition})`;
        }
        else {
            const columns = constraintMeta.columns.select(o => this.q.enclose(o.columnName)).toArray().join(",");
            result = `CONSTRAINT ${this.q.enclose(constraintMeta.name)} UNIQUE (${columns})`;
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
            type = this.q.valueTypeMap.get(column as any);
        }
        else {
            columnOption = column as IColumnMetaData<T>;
            if (!columnOption.columnType) {
                return this.getColumnType(columnOption.type as any);
            }
            type = columnOption.columnType;
            if (!this.q.supportedColumnTypes.has(type)) {
                if (this.q.columnTypeMap) {
                    if (this.q.columnTypeMap.has(type))
                        type = this.q.columnTypeMap.get(type);
                    else if (this.q.columnTypeMap.has("defaultBinary") && columnOption instanceof StringColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultBinary");
                    else if (this.q.columnTypeMap.has("defaultBoolean") && columnOption instanceof BooleanColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultBoolean");
                    else if (this.q.columnTypeMap.has("defaultDataString") && columnOption instanceof StringDataColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultDataString");
                    else if (this.q.columnTypeMap.has("defaultDate") && columnOption instanceof DateColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultDate");
                    else if (this.q.columnTypeMap.has("defaultDateTime") && columnOption instanceof DateTimeColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultDateTime");
                    else if (this.q.columnTypeMap.has("defaultTime") && columnOption instanceof TimeColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultTime");
                    else if (this.q.columnTypeMap.has("defaultDecimal") && columnOption instanceof DecimalColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultDecimal");
                    else if (this.q.columnTypeMap.has("defaultEnum") && columnOption instanceof EnumColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultEnum");
                    else if (this.q.columnTypeMap.has("defaultIdentifier") && columnOption instanceof IdentifierColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultIdentifier");
                    else if (this.q.columnTypeMap.has("defaultNumberic") && columnOption instanceof NumericColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultNumberic");
                    else if (this.q.columnTypeMap.has("defaultString") && columnOption instanceof StringColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultString");
                    else if (this.q.columnTypeMap.has("defaultRowVersion") && columnOption instanceof RowVersionColumnMetaData)
                        type = this.q.columnTypeMap.get("defaultRowVersion");
                    else
                        throw new Error(`${type} is not supported`);
                }
            }
        }
        const typeDefault = this.q.columnTypeDefaults.get(columnOption.columnType);
        const option = columnOption as any;
        const size: number = option && typeof option.size !== "undefined" ? option.size : typeDefault ? typeDefault.size : undefined;
        const length: number = option && typeof option.length !== "undefined" ? option.length : typeDefault ? typeDefault.length : undefined;
        const scale: number = option && typeof option.size !== "undefined" ? option.scale : typeDefault ? typeDefault.scale : undefined;
        const precision: number = option && typeof option.size !== "undefined" ? option.precision : typeDefault ? typeDefault.precision : undefined;
        if (this.q.columnTypesWithOption.contains(type)) {
            if (typeof length !== "undefined") {
                type += `(${length})`;
            }
            else if (typeof size !== "undefined") {
                type += `(${size})`;
            }
            else if (typeof scale !== "undefined" && typeof precision !== "undefined") {
                type += `(${precision}, ${scale})`;
            }
            else if (typeof precision !== "undefined") {
                type += `(${precision})`;
            }
        }
        return type;
    }
    protected primaryKeyDeclaration(entityMeta: IEntityMetaData) {
        const pkName = "PK_" + entityMeta.name;
        const columnQuery = entityMeta.primaryKeys.select(o => this.q.enclose(o.columnName)).toArray().join(",");

        return `CONSTRAINT ${this.q.enclose(pkName)} PRIMARY KEY (${columnQuery})`;
    }
    protected foreignKeyDeclaration(relationMeta: IRelationMetaData) {
        const columns = relationMeta.relationColumns.select(o => this.q.enclose(o.columnName)).toArray().join(", ");
        const referenceColumns = relationMeta.reverseRelation.relationColumns.select(o => this.q.enclose(o.columnName)).toArray().join(", ");
        return `CONSTRAINT ${this.q.enclose(relationMeta.fullName)}` +
            ` FOREIGN KEY (${columns})` +
            ` REFERENCES ${this.q.entityName(relationMeta.target)} (${referenceColumns})` +
            ` ON UPDATE ${relationMeta.updateOption} ON DELETE ${relationMeta.deleteOption}`;
    }
    protected defaultValue(columnMeta: IColumnMetaData) {
        if (columnMeta.default) {
            return this.q.getExpressionString(columnMeta.default.body);
        }
        const groupType = this.q.supportedColumnTypes.get(columnMeta.columnType);
        if (groupType === "Numeric" || groupType === "Decimal" || groupType === "Real" || columnMeta instanceof NumericColumnMetaData || columnMeta instanceof DecimalColumnMetaData)
            return this.q.getValueString(0);
        if (groupType === "Identifier" || columnMeta instanceof IdentifierColumnMetaData)
            return "NEWID()";
        if (groupType === "String" || groupType === "DataString" || columnMeta instanceof StringColumnMetaData || columnMeta instanceof StringDataColumnMetaData)
            return this.q.getValueString("");
        if (groupType === "Date" || columnMeta instanceof DateColumnMetaData)
            return "GETUTCDATE()";
        if (groupType === "Time" || columnMeta instanceof TimeColumnMetaData)
            return "CONVERT(TIME, GETUTCDATE())";
        if (groupType === "RowVersion" || columnMeta instanceof RowVersionColumn)
            return "CURRENT_TIMESTAMP";

        throw new Error(`${columnMeta.columnType} not supported`);
    }


    protected rebuildEntitySchema<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>) {
        const columnMetas = schema.columns.select(o => ({
            columnSchema: o,
            oldColumnSchema: oldSchema.columns.first(c => c.columnName === o.columnName)
        }));

        let result: IQuery[] = [];

        const cloneSchema = Object.assign({}, schema);
        cloneSchema.name = "TEMP_" + this.q.newAlias();

        result = result.concat(this.createEntitySchema(cloneSchema));

        // turn on identity insert coz rebuild schema most likely called because identity insert issue.
        result.push({
            query: `SET IDENTITY_INSERT ${this.q.entityName(cloneSchema)} ON`,
            type: QueryType.DCL
        });

        // copy value
        const newColumns = columnMetas.where(o => !!o.oldColumnSchema).select(o => this.q.enclose(o.columnSchema.columnName)).toArray().join(",");
        const copyColumns = columnMetas.where(o => !!o.oldColumnSchema).select(o => this.q.enclose(o.oldColumnSchema.columnName)).toArray().join(",");
        result.push({
            query: `INSERT INTO ${this.q.entityName(cloneSchema)} (${newColumns}) SELECT ${copyColumns} FROM ${this.q.entityName(oldSchema)} WITH (HOLDLOCK TABLOCKX)`,
            type: QueryType.DML
        });

        // turn of identity insert
        result.push({
            query: `SET IDENTITY_INSERT ${this.q.entityName(cloneSchema)} OFF`,
            type: QueryType.DCL
        });

        // remove all foreignkey reference to current table
        result = result.concat(this.dropAllMasterRelations(oldSchema));

        // rename temp table
        result = result.concat(this.renameTable(cloneSchema, this.q.entityName(schema)));

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
            .union(schema.indices.selectMany(o => this.addIndex(o))).toArray();
    }
}
