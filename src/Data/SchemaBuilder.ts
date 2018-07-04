import { IDriver } from "../Driver/IDriver";
import { IEntityMetaData } from "../MetaData/Interface";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { IObjectType } from "../Common/Type";
import { DecimalColumnMetaData, StringColumnMetaData, NumericColumnMetaData } from "../MetaData";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IConstraintMetaData } from "../MetaData/Interface/IConstraintMetaData";
import { IQueryCommand } from "../QueryBuilder/Interface/IQueryCommand";
import { FunctionExpression } from "../ExpressionBuilder/Expression";
import { IConnection } from "../Connection/IConnection";

export abstract class SchemaBuilder {
    constructor(public connection: IConnection, public q: QueryBuilder) { }
    public async getSchemaQuery(entityTypes: IObjectType[]) {
        let commitQueries: IQueryCommand[] = [];
        let rollbackQueries: IQueryCommand[] = [];

        const defaultSchema = (await this.connection.executeQuery(`SELECT SCHEMA_NAME() AS ${this.q.enclose("SCHEMA")}`)).first().rows.first()["SCHEMA"];

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

        let preCommitQueries: IQueryCommand[] = [];
        let preRollbackQueries: IQueryCommand[] = [];

        let postCommitQueries: IQueryCommand[] = [];
        let postRollbackQueries: IQueryCommand[] = [];

        for (const schemaMap of schemaMaps) {
            const schema = schemaMap.schema;
            const oldSchema = schemaMap.oldSchema;
            if (schema && oldSchema) {
                preCommitQueries = preCommitQueries.concat(this.q.dropAllOldRelationsQueries(schema, oldSchema));
                preRollbackQueries = preRollbackQueries.concat(this.q.dropAllOldRelationsQueries(oldSchema, schema));

                commitQueries = commitQueries.concat(this.q.updateEntitySchemaQuery(schema, oldSchema));
                rollbackQueries = rollbackQueries.concat(this.q.updateEntitySchemaQuery(oldSchema, schema));

                postCommitQueries = postCommitQueries.concat(this.q.addAllNewRelationsQueries(schema, oldSchema));
                postRollbackQueries = postRollbackQueries.concat(this.q.addAllNewRelationsQueries(oldSchema, schema));
            }
            else if (!oldSchema) {
                preRollbackQueries = preRollbackQueries.concat(schema.relations.selectMany(o => this.q.dropForeignKeyQuery(o)).toArray());

                commitQueries = commitQueries.concat(this.q.createEntitySchemaQuery(schema));
                rollbackQueries = rollbackQueries.concat(this.q.dropTableQuery(schema));

                postCommitQueries = postCommitQueries.concat(schema.relations.selectMany(o => this.q.addForeignKeyQuery(o)).toArray());
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

        const schemaDatas = await this.connection.executeQuery(queries);
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
            const fkRelation: IRelationMetaData = {
                source: foreignKey.meta.entity,
                target: targetConstraint.meta.entity,
                fullName: relationName,
                relationColumns: foreignKey.meta.columns,
                isMaster: false,
                relationType: relationType,
                relationMaps: new Map()
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
            for (let i = 0; i < fkRelation.relationColumns.length; i++) {
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
            }
            const column = entity.columns.first(o => o.columnName === indexSchema["COLUMN_NAME"]);
            index.columns.push(column);
        }

        return Object.keys(result).select(o => result[o]).toArray();
    }
}
