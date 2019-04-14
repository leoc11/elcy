import { RelationSchemaBuilder } from "../Relation/RelationSchemaBuilder";
import { QueryType, ReferenceOption } from "../../Common/Type";
import { IQuery } from "../../Query/IQuery";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { IConstraintMetaData } from "../../MetaData/Interface/IConstraintMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { ICheckConstraintMetaData } from "../../MetaData/Interface/ICheckConstraintMetaData";
import { IIndexMetaData } from "../../MetaData/Interface/IIndexMetaData";
import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";
import { ColumnTypeMapKey } from "../../Common/ColumnType";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";

export class SqliteSchemaBuilder extends RelationSchemaBuilder {
    public columnTypeMap = new Map<ColumnTypeMapKey, ICompleteColumnType>([
        ["integer", { columnType: "integer", group: "Integer" }],
        ["numeric", { columnType: "numeric", group: "Decimal" }],
        ["text", { columnType: "text", group: "String" }],
        ["blob", { columnType: "blob", group: "Binary" }],
        ["real", { columnType: "real", group: "Real" }],
        ["defaultBoolean", { columnType: "numeric" }],
        ["defaultBinary", { columnType: "blob" }],
        ["defaultDataSerialization", { columnType: "text" }],
        ["defaultDate", { columnType: "text" }],
        ["defaultDateTime", { columnType: "text" }],
        ["defaultTime", { columnType: "text" }],
        ["defaultDecimal", { columnType: "numeric" }],
        ["defaultEnum", { columnType: "text" }],
        ["defaultIdentifier", { columnType: "text" }],
        ["defaultInteger", { columnType: "integer" }],
        ["defaultReal", { columnType: "real" }],
        ["defaultString", { columnType: "text" }],
        ["defaultRowVersion", { columnType: "numeric" }]
    ]);
    public async loadSchemas(entities: IEntityMetaData<any>[]) {
        const nameReg = /CONSTRAINT "([^"]+)"/i;
        const checkDefReg = /CHECK\s*\((.*)\)/i;

        const tableNames = entities.select(o => `'${o.name}'`).toArray().join(",");
        const schemaDatas = await this.connection.executeQuery({
            query: `SELECT * FROM "sqlite_master" WHERE type='table' AND tbl_name IN (${tableNames})`,
            type: QueryType.DQL
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
                inheritance: null
            };
            result[entity.name] = entity;

            const columnSchemas = await this.connection.executeQuery({
                query: `PRAGMA TABLE_INFO("${entity.name}")`,
                type: QueryType.DQL
            });

            for (const columnSchema of columnSchemas.first().rows) {
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

                if (column.isPrimaryColumn)
                    entity.primaryKeys.push(column);
            }

            const indexSchemas = await this.connection.executeQuery({
                query: `PRAGMA INDEX_LIST("${entity.name}")`,
                type: QueryType.DQL
            });

            // index
            for (const indexSchema of indexSchemas.first().rows.where(o => o["origin"] === "c")) {
                const indexName = indexSchema["name"];
                const index: IIndexMetaData = {
                    name: indexName,
                    columns: [],
                    entity: entity,
                    unique: (indexSchema["unique"] || "").toString() === "1"
                };
                entity.indices.push(index);
                const indexInfos = await this.connection.executeQuery({
                    query: `PRAGMA INDEX_INFO("${indexName}")`,
                    type: QueryType.DQL
                });

                index.columns = indexInfos.first().rows.orderBy([o => o["seqno"]])
                    .select(o => entity.columns.first(c => c.columnName === o["name"]))
                    .where(o => !!o)
                    .toArray();
            }

            // unique constraint
            for (const constaintSchema of indexSchemas.first().rows.where(o => o["origin"] === "u")) {
                const constaintName = constaintSchema["name"];
                const constraintMeta: IConstraintMetaData = {
                    name: constaintName,
                    entity: entity,
                    columns: []
                };
                entity.constraints.push(constraintMeta);
                const indexInfos = await this.connection.executeQuery({
                    query: `PRAGMA INDEX_INFO("${constaintName}")`,
                    type: QueryType.DQL
                });

                constraintMeta.columns = indexInfos.first().rows.orderBy([o => o["seqno"]])
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
                    definition: defStr,
                    getDefinitionString: function () { return this.definition as string; }
                };
                entity.constraints.push(check);
            }

            // check autoincrement
            const autoIncrementCol = sqlLines.select(o => {
                o = o.trim();
                const index = o.indexOf(" ");
                const columnName = o.substr(0, index).replace("\"", "");
                return {
                    columnName,
                    sql: o.substr(index + 1)
                };
            }).first(o => o.sql.search(/AUTOINCREMENT/i) >= 0);

            if (autoIncrementCol) {
                const column = entity.columns.first(o => o.columnName === autoIncrementCol.columnName);
                (column as IntegerColumnMetaData).autoIncrement = true;
            }
        }

        // foreign keys
        for (const entityName in result) {
            const foreignKeySchemas = await this.connection.executeQuery({
                query: `PRAGMA FOREIGN_KEY_LIST("${entityName}")`,
                type: QueryType.DQL
            });
            for (const relationSchema of foreignKeySchemas[0].rows.orderBy([o => o["table"]], [o => o["seq"]]).groupBy(o => o["table"])) {
                const source = result[entityName]; // orderdetail
                const target = result[relationSchema.key]; // order
                const relationName = `${entityName}_${relationSchema.key}`;

                const sourceCols = relationSchema.select(o => source.columns.first(c => c.columnName === o["from"])).where(o => !!o).toArray();
                const targetCols = relationSchema.select(o => target.columns.first(c => c.columnName === o["to"])).where(o => !!o).toArray();
                const relationType = targetCols.all(o => target.primaryKeys.contains(o)) ? "one" : "many";

                const updateOption: ReferenceOption = relationSchema.first()["on_update"].toUpperCase();
                const deleteOption: ReferenceOption = relationSchema.first()["on_delete"].toUpperCase();
                const fkRelation: IRelationMetaData = {
                    source: source,
                    target: target,
                    fullName: relationName,
                    relationColumns: sourceCols,
                    isMaster: false,
                    relationType: relationType,
                    relationMaps: new Map(),
                    updateOption: updateOption,
                    deleteOption: deleteOption
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
                for (let i = 0, len = fkRelation.relationColumns.length; i < len; i++) {
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

    public dropTable<TE>(entityMeta: IEntityMetaData<TE>): IQuery[] {
        const result = super.dropTable(entityMeta);
        result.unshift({
            query: "PRAGMA foreign_keys = OFF",
            type: QueryType.DCL
        });
        result.push({
            query: "PRAGMA foreign_keys = ON",
            type: QueryType.DCL
        });

        return result;
    }
    public dropForeignKey(relationMeta: IRelationMetaData): IQuery[] {
        return [];
    }
    public addForeignKey(relationMeta: IRelationMetaData): IQuery[] {
        return [];
    }
    public renameTable<TE>(entityMetaData: IEntityMetaData<TE>, newName: string): IQuery[] {
        let query = `ALTER TABLE ${this.entityName(entityMetaData)} RENAME TO ${this.queryBuilder.enclose(newName)}`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    protected updateEntitySchema<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>) {
        let result: IQuery[] = [];
        const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
            return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
        };
        const isIndexEquals = (index1: IIndexMetaData, index2: IIndexMetaData) => {
            return !!index1.unique === !!index2.unique && isColumnsEquals(index1.columns, index1.columns);
        };
        const isConstraintEquals = (cons1: IConstraintMetaData, cons2: IConstraintMetaData) => {
            const check1 = cons1 as ICheckConstraintMetaData;
            const check2 = cons2 as ICheckConstraintMetaData;
            const checkDef1 = !check1.definition ? undefined : check1.getDefinitionString(this.queryBuilder);
            const checkDef2 = !check2.definition ? undefined : check2.getDefinitionString(this.queryBuilder);
            return checkDef1 === checkDef2 && isColumnsEquals(cons1.columns, cons2.columns);
        };
        const isColumnEquals = (col1: IColumnMetaData, col2: IColumnMetaData) => {
            return this.columnDeclaration(col1, "add") !== this.columnDeclaration(col2, "add");
        };

        // check primarykey changes
        let requireRebuildTable = !isColumnsEquals(schema.primaryKeys, oldSchema.primaryKeys);

        // check foreignkey changes
        const relations = schema.relations.slice(0);
        requireRebuildTable = requireRebuildTable || oldSchema.relations.any(o => !relations.any(or => isColumnsEquals(o.relationColumns, or.relationColumns)));

        // check index
        const indices = schema.indices.slice(0);
        requireRebuildTable = requireRebuildTable || oldSchema.indices.any(o => !indices.any(ix => isIndexEquals(ix, o)));

        // check constraint
        const constraints = schema.constraints.slice(0);
        requireRebuildTable = requireRebuildTable || oldSchema.constraints.any(o => !constraints.any(c => isConstraintEquals(c, o)));

        // check column
        requireRebuildTable = requireRebuildTable || oldSchema.columns.length > schema.columns.length || oldSchema.columns.any(o => !schema.columns.any(c => isColumnEquals(c, o)));

        if (requireRebuildTable) {
            result.push({
                query: "PRAGMA foreign_keys = OFF",
                type: QueryType.DCL
            });
            const tempName = `temp_${schema.name}`;
            result = result.concat(this.createTable(schema, tempName));

            const columns = schema.columns.where(o => oldSchema.columns.any(c => c.columnName === o.columnName)).select(o => this.queryBuilder.enclose(o.columnName)).toArray().join(",");
            result.push({
                query: `INSERT INTO ${this.queryBuilder.enclose(tempName)} (${columns}) SELECT ${columns} FROM ${this.entityName(oldSchema)}`,
                type: QueryType.DML
            });

            result = result.concat(this.dropTable(oldSchema));

            result = result.concat(this.renameTable(schema, oldSchema.name));

            result.push({
                query: "PRAGMA foreign_keys = ON",
                type: QueryType.DCL
            });
        }
        else {
            // check all new columns to be added
            const newColumns = schema.columns.where(o => !oldSchema.columns.any(c => o.columnName === c.columnName));
            result = result.concat(newColumns.selectMany(o => this.addColumn(o)).toArray());
        }

        return result;
    }
}
