import { SchemaBuilder } from "../../Data/SchemaBuilder";
import { IConnection } from "../../Connection/IConnection";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IObjectType } from "../../Common/Type";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { IConstraintMetaData } from "../../MetaData/Interface/IConstraintMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { ICheckConstraintMetaData } from "../../MetaData/Interface/ICheckConstraintMetaData";

export class SqliteSchemaBuilder extends SchemaBuilder {
    constructor(public connection: IConnection, public q: QueryBuilder) {
        super(connection, q);
    }
    public async getSchemaQuery(entityTypes: IObjectType[]) {
        let commitQueries: IQueryCommand[] = [];
        let rollbackQueries: IQueryCommand[] = [];

        const schemas = entityTypes.select(o => Reflect.getOwnMetadata(entityMetaKey, o) as IEntityMetaData<any>).toArray();

        const oldSchemas = await this.loadSchemas(schemas);

        const schemaMaps = schemas.select(o => ({
            schema: o,
            oldSchema: oldSchemas.first(os => os.name.toLowerCase() === o.name.toLowerCase())
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
        const nameReg = /CONSTRAINT "([^"]+)"/i;
        const checkDefReg = /CHECK\s*\((.*)\)/i;

        const schemaDatas = await this.connection.executeQuery({
            query: `SELECT * FROM "sqlite_master" WHERE type='table'`,
            type: "DQL"
        });
        const tableSchemas = schemaDatas[0];

        // convert all schema to entityMetaData for comparison
        const result: { [key: string]: IEntityMetaData<any> } = {};
        for (const tableSchema of tableSchemas.rows) {
            const entity: IEntityMetaData<any> = {
                name: tableSchema["tbl_name"],
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
            result[entity.name] = entity;

            const columnSchemas = await this.connection.executeQuery({
                query: `PRAGMA TABLE_INFO("${entity.name}")`,
                type: "DQL"
            });

            for (const columnSchema of columnSchemas[0].rows) {
                const defaultExpression: string = columnSchema["dflt_value"];
                const column: IColumnMetaData = {
                    columnName: columnSchema["name"],
                    nullable: columnSchema["notnull"] === 0,
                    columnType: columnSchema["type"],
                    isPrimaryColumn: columnSchema["pk"] > 0
                    // charset: columnSchema["CHARACTER_SET_NAME"],
                    // collation: columnSchema["COLLATION_NAME"]
                };
                if (defaultExpression) {
                    const defaultExp = new FunctionExpression(null, []);
                    const defaultString = defaultExpression.substring(1, defaultExpression.length - 1);
                    defaultExp.toString = () => defaultString;
                    column.default = defaultExp;
                }
                column.entity = entity;
                entity.columns.push(column);
            }

            const indexSchemas = await this.connection.executeQuery({
                query: `PRAGMA INDEX_LIST("${entity.name}")`,
                type: "DQL"
            });

            // index
            for (const indexSchema of indexSchemas[0].rows.where(o => o["origin"] === "c")) {
                const indexName = indexSchema["name"];
                let index = entity.indices.first(o => o.name === indexName);
                if (!index) {
                    index = {
                        name: indexName,
                        columns: [],
                        entity: entity,
                        unique: false
                    };
                    entity.indices.push(index);
                }
                const indexInfos = await this.connection.executeQuery({
                    query: `PRAGMA INDEX_INFO("${indexName}")`,
                    type: "DQL"
                });

                index.columns = indexInfos[0].rows.orderBy([o => o["seqno"]])
                    .select(o => entity.columns.first(c => c.columnName === o["name"]))
                    .where(o => !!o)
                    .toArray();
            }

            // unique constraint
            for (const constaintSchema of indexSchemas[0].rows.where(o => o["origin"] === "u")) {
                const constaintName = constaintSchema["name"];
                const constraintMeta: IConstraintMetaData = {
                    name: constaintName,
                    entity: entity,
                    columns: []
                };
                entity.constraints.push(constraintMeta);
                const indexInfos = await this.connection.executeQuery({
                    query: `PRAGMA INDEX_INFO("${constaintName}")`,
                    type: "DQL"
                });

                constraintMeta.columns = indexInfos[0].rows.orderBy([o => o["seqno"]])
                    .select(o => entity.columns.first(c => c.columnName === o["name"]))
                    .where(o => !!o)
                    .toArray();
            }

            // check constraint
            const sqlLines: string[] = tableSchema["sql"].replace(/['`\[\]]/g, "\"").split(/\n/ig);
            for (const checkStr of sqlLines.where(o => o.search(checkDefReg) >= 0)) {
                let name = "";
                let defStr = "";
                const nameRes = nameReg.exec(checkStr);
                if (nameRes) {
                    name = nameRes[1];
                }
                const defRes = checkDefReg.exec(checkStr);
                if (defRes) {
                    defStr = defRes[1];
                }

                const check: ICheckConstraintMetaData = {
                    name: name,
                    entity: entity,
                    columns: [],
                    definition: defStr
                };
                entity.constraints.push(check);
            }
        }

        // foreign keys
        for (const entityName in result) {
            const foreignKeySchemas = await this.connection.executeQuery({
                query: `PRAGMA FOREIGN_KEY_LIST("${entityName}")`,
                type: "DQL"
            });
            for (const relationSchema of foreignKeySchemas[0].rows.orderBy([o => o["table"]], [o => o["seq"]]).groupBy(o => o["table"])) {
                const target = result[entityName];
                const source = result[relationSchema.key];
                const relationName = `${relationSchema.key}_${entityName}`;

                const sourceCols = relationSchema.select(o => source.columns.first(c => c.columnName === o["to"])).where(o => !!o).toArray();
                const targetCols = relationSchema.select(o => target.columns.first(c => c.columnName === o["from"])).where(o => !!o).toArray();
                const relationType = targetCols.all(o => target.primaryKeys.contains(o)) ? "one" : "many";
                const fkRelation: IRelationMetaData = {
                    source: source,
                    target: target,
                    fullName: relationName,
                    relationColumns: sourceCols,
                    isMaster: false,
                    relationType: relationType,
                    relationMaps: new Map()
                };
                const reverseFkRelation: IRelationMetaData = {
                    source: target,
                    target: source,
                    fullName: relationName,
                    relationColumns: targetCols,
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

                source.relations.push(fkRelation);
                target.relations.push(reverseFkRelation);
            }
        }

        return Object.keys(result).select(o => result[o]).toArray();
    }
}
