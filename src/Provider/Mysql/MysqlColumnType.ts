export type MysqlInt = "integer" | "int" | "tinyint" | "smallint" | "mediumint" | "bigint";
export type MysqlReal = "float" | "double" | "real" | "double precision";
export type MysqlDecimal = "decimal" | "numeric";
export type MysqlDate = "date";
export type MysqlDateTime = "datetime" | "timestamp";
export type MysqlTime = "time";
export type MysqlInterval = "year";
export type MysqlRowVersion = "timestamp";
export type MysqlBinary = "tinyblob" | "mediumblob" | "blob" | "longblob"
    | "binary" | "varbinary";
export type MysqlString = "character" | "varchar" | "char" | "tinytext"
    | "mediumtext" | "text" | "longtext";
export type MysqlBoolean = "bit";
export type MysqlSpatial = "geometry" | "point" | "linestring" | "polygon"
    | "multipoint" | "multilinestring" | "multipolygon" | "geomertycollection";
export type MysqlIdentifier = "binary";
export type MysqlSerialize = "json";
export type MysqlEnum = "enum";
export type MysqlColumnType = MysqlInt | MysqlDecimal | MysqlReal | MysqlDate | MysqlDateTime
    | MysqlTime | MysqlInterval | MysqlRowVersion | MysqlBinary | MysqlString | MysqlBoolean
    | MysqlSpatial | MysqlIdentifier | MysqlSerialize | MysqlEnum;
