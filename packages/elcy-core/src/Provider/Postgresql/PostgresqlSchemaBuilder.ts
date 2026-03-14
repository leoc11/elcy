import { ColumnTypeMapKey } from "../../Common/ColumnType";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { RelationalSchemaBuilder } from "../Relational/RelationalSchemaBuilder";

export class PostgresqlSchemaBuilder extends RelationalSchemaBuilder {
    public columnTypeMap: Map<ColumnTypeMapKey, ICompleteColumnType> = new Map<ColumnTypeMapKey, ICompleteColumnType>([
        ["smallint", { columnType: "smallint", group: "Integer" }],
        ["int2", { columnType: "int2", group: "Integer" }],
        ["integer", { columnType: "integer", group: "Integer" }],
        ["int", { columnType: "int", group: "Integer" }],
        ["int4", { columnType: "int4", group: "Integer" }],
        ["bigint", { columnType: "bigint", group: "Integer" }],
        ["int8", { columnType: "int8", group: "Integer" }],
        ["numeric", { columnType: "numeric", group: "Decimal", option: { precision: 18, scale: 0 } }],
        ["real", { columnType: "real", group: "Real" }],
        ["float", { columnType: "float", group: "Real", option: { precision: 18 } }],
        ["double precision", { columnType: "double precision", group: "Real" }],
        ["money", { columnType: "money", group: "Decimal" }],
        ["varchar", { columnType: "varchar", group: "String", option: { length: 50 } }],
        ["character varying", { columnType: "character varying", group: "String", option: { length: 50 } }],
        ["char", { columnType: "char", group: "String", option: { length: 10 } }],
        ["character", { columnType: "character", group: "String", option: { length: 10 } }],
        ["text", { columnType: "text", group: "String" }],
        ["bytea", { columnType: "bytea", group: "Binary" }],
        ["bit", { columnType: "bit", group: "Binary", option: { length: 50 } }],
        ["bit varying", { columnType: "bit varying", group: "Binary", option: { length: 50 } }],
        ["timestamp", { columnType: "timestamp", group: "DateTime" }], // option: with time zone
        ["date", { columnType: "date", group: "Date" }],
        ["time", { columnType: "time", group: "Time" }], // option: with time zone
        ["boolean", { columnType: "boolean", group: "Boolean" }],
        ["uuid", { columnType: "uuid", group: "Identifier" }],
        ["xml", { columnType: "xml", group: "Serialize" }],
        ["json", { columnType: "json", group: "Serialize" }],
        ["defaultBoolean", { columnType: "boolean"}],
        ["defaultBinary", { columnType: "bytea"}],
        ["defaultSerialize", { columnType: "json"}],
        ["defaultDate", { columnType: "date"}],
        ["defaultDateTime", { columnType: "timestamp"}],
        ["defaultTime", { columnType: "time"}],
        ["defaultDecimal", { columnType: "numeric"}],
        ["defaultEnum", { columnType: "varchar"}],
        ["defaultIdentifier", { columnType: "uuid"}],
        ["defaultInteger", { columnType: "integer"}],
        ["defaultString", { columnType: "varchar"}],
        ["defaultRowVersion", { columnType: "timestamp"}]

        // Enumerated type (custom types)
        // Geometry
        // ["point", { columnType: "point", group: "Geometry"}],
        // ["line", { columnType: "line", group: "Geometry"}],
        // ["lseg", { columnType: "lseg", group: "Geometry"}],
        // ["box", { columnType: "box", group: "Geometry"}],
        // ["path", { columnType: "path", group: "Geometry"}], // open and close type
        // ["polygon", { columnType: "polygon", group: "Geometry"}],
        // ["circle", { columnType: "circle", group: "Geometry"}],
        // Network Address
        // ["cidr", { columnType: "cidr", group: "Network"}],
        // ["inet", { columnType: "inet", group: "Network"}],
        // ["macaddr", { columnType: "macaddr", group: "Network"}],
        // Text Search
        // ["tsvector", { columnType: "tsvector", group: "Search"}],
        // ["tsquery", { columnType: "tsquery", group: "Search"}],
        // Arrays
        // Composite
        // Range
        // ["int4range", { columnType: "int4range", group: "Range"}],
        // ["int8range", { columnType: "int8range", group: "Range"}],
        // ["numrange", { columnType: "numrange", group: "Range"}],
        // ["tsrange", { columnType: "tsrange", group: "Range"}],
        // ["tstzrange", { columnType: "tstzrange", group: "Range"}],
        // ["daterange", { columnType: "daterange", group: "Range"}],
        // ["interval", { columnType: "interval", group: "Interval"}],
    ]);
}
