import { ColumnTypeMapKey } from "../../Common/ColumnType";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { RelationalSchemaBuilder } from "../Relational/RelationalSchemaBuilder";
import { MysqlColumnType } from "./MysqlColumnType";

export class MysqlSchemaBuilder extends RelationalSchemaBuilder {
    public columnTypeMap = new Map<ColumnTypeMapKey, ICompleteColumnType<MysqlColumnType>>([
        ["integer", { columnType: "integer", group: "Integer" }],
        ["int", { columnType: "int", group: "Integer" }],
        ["smallint", { columnType: "smallint", group: "Integer" }],
        ["tinyint", { columnType: "tinyint", group: "Integer" }],
        ["mediumint", { columnType: "mediumint", group: "Integer" }],
        ["bigint", { columnType: "bigint", group: "Integer" }],
        ["decimal", { columnType: "decimal", group: "Decimal", option: { precision: 18, scale: 0 } }],
        ["numeric", { columnType: "numeric", group: "Decimal", option: { precision: 18, scale: 0 } }],
        ["float", { columnType: "float", group: "Real", option: {} }],
        ["double", { columnType: "double", group: "Real" }],
        ["real", { columnType: "real", group: "Real", option: {} }],
        ["double precision", { columnType: "double precision", group: "Real", option: {} }],
        ["date", { columnType: "date", group: "Date" }],
        ["datetime", { columnType: "datetime", group: "DateTime" }],
        ["timestamp", { columnType: "timestamp", group: "DateTime" }],
        ["time", { columnType: "time", group: "Time" }],
        ["char", { columnType: "char", group: "String", option: { length: 10 } }],
        ["varchar", { columnType: "varchar", group: "String", option: { length: 50 } }],
        ["text", { columnType: "text", group: "String" }],
        ["bit", { columnType: "bit", group: "Binary" }],
        ["binary", { columnType: "binary", group: "Binary", option: { size: 10 } }],
        ["varbinary", { columnType: "varbinary", group: "Binary", option: { length: 50 } }],
        ["blob", { columnType: "blob", group: "Binary" }],
        ["enum", { columnType: "enum", group: "Enum" }],
        ["json", { columnType: "json", group: "Serialize" }],
        ["defaultBoolean", { columnType: "bit" }],
        ["defaultBinary", { columnType: "varbinary" }],
        ["defaultSerialize", { columnType: "json" }],
        ["defaultDate", { columnType: "date" }],
        ["defaultDateTime", { columnType: "datetime" }],
        ["defaultTime", { columnType: "time" }],
        ["defaultDecimal", { columnType: "decimal" }],
        ["defaultEnum", { columnType: "enum" }],
        ["defaultIdentifier", { columnType: "binary", option: { size: 16 } }],
        ["defaultInteger", { columnType: "int" }],
        ["defaultString", { columnType: "varchar" }],
        ["defaultRowVersion", { columnType: "timestamp" }]

        // ["year", { columnType: "year", group: "Interval"}]
        // ["set", { columnType: "set", group: "Set"}],
        // ["geometry", { columnType: "geometry", group: "Spacial"}],
        // ["point", { columnType: "point", group: "Spacial"}],
        // ["linestring", { columnType: "linestring", group: "Spacial"}],
        // ["polygon", { columnType: "polygon", group: "Spacial"}],
        // ["multipoint", { columnType: "multipoint", group: "SpacialCollection"}],
        // ["multilinestring", { columnType: "multilinestring", group: "SpacialCollection"}],
        // ["multipolygon", { columnType: "multipolygon", group: "SpacialCollection"}],
        // ["geometrycollection", { columnType: "geometrycollection", group: "SpacialCollection"}],
    ]);
}
