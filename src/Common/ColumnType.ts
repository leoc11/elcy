/**
 * int Column types with length
 */
export type IntLengthColumnType = "int" // mysql, postgres, mssql, oracle, sqlite
    | "tinyint" // mysql, mssql, sqlite
    | "smallint" // mysql, postgres, mssql, oracle, sqlite
    | "mediumint" // mysql, sqlite
    | "bigint"; // mysql, postgres, mssql, sqlite

/**
 * int Column types
 */
export type IntColumnType = IntLengthColumnType
    | "int2" // postgres, sqlite
    | "int2" // postgres, sqlite
    | "int4" // postgres
    | "int8" // postgres, sqlite
    | "integer" // postgres, oracle, sqlite
    | "unsigned big int"; // sqlite

/**
 * Decimal column types
 */
export type DecimalColumnType = "float" // mysql, mssql, oracle, sqlite
    | "float4" // postgres
    | "float8" // postgres
    | "double" // mysql, sqlite
    | "dec" // oracle, mssql
    | "decimal" // mysql, postgres, mssql, sqlite
    | "numeric" // postgres, mssql, sqlite
    | "real" // mysql, postgres, mssql, oracle, sqlite
    | "double precision" // postgres, oracle, sqlite
    | "number" // oracle
    | "smallmoney" // mssql
    | "money"; // postgres, mssql

/**
 * Time column types
 */
export type TimeColumnType = "time" // mysql, postgres, mssql
    | "time with time zone" // postgres
    | "time without time zone" // postgres
    | "datetimeoffset" // mssql
    | "interval year" // oracle
    | "interval day" // oracle
    | "interval"; // postgres

/**
 * Date column types
 */
export type DateColumnType = "datetime" // mssql, mysql, sqlite
    | "datetime2" // mssql
    | "smalldatetime" // mssql
    | "date" // mysql, postgres, mssql, oracle, sqlite
    | "datetimeoffset" // mssql
    | "interval year" // oracle
    | "interval day" // oracle
    | "interval" // postgres
    | "year"; // mysql

export type TimestampColumnType = "timestamp" // mysql, postgres, mssql, oracle
    | "timestamp without time zone" // postgres
    | "timestamp with time zone" // postgres, oracle
    | "timestamp with local time zone"; // oracle

export type BinaryColumnType = "binary" // mssql
    | "varbinary" // mssql
    | "tinyblob" // mysql
    | "mediumblob" // mysql
    | "blob" // mysql, oracle, sqlite
    | "longblob" // mysql
    | "bytea" // postgres
    | "long" // oracle
    | "raw" // oracle
    | "long raw" // oracle
    | "bfile" // oracle
    | "clob" // oracle, sqlite
    | "nclob" // oracle
    | "image"; // mssql
/**
 * Column types where column length is used.
 */
export type StringColumnType = "character varying" // postgres
    | "varying character" // sqlite
    | "nvarchar" // mssql
    | "character" // mysql, postgres, sqlite
    | "native character" // sqlite
    | "varchar" // mysql, postgres, mssql, sqlite
    | "char" // mysql, postgres, mssql, oracle
    | "nchar" // mssql, oracle, sqlite
    | "varchar2" // oracle
    | "nvarchar2"; // oracle, sqlite
/**
 * Column types with large string value.
 */
export type TextColumnType = "tinytext" // mysql
    | "mediumtext" // mysql
    | "text" // mysql, postgres, mssql, sqlite
    | "ntext" // mssql
    | "longtext" // mysql
    | "citext"; // postgres

/**
 * Boolean column types
 */
export type BooleanColumnType = "bit" // mssql
    | "boolean" // postgres, sqlite
    | "bool"; // postgres

/**
 * Geometric column types
 */
export type GeometricColumnType = "point" // postgres
    | "line" // postgres
    | "lseg" // postgres
    | "box" // postgres
    | "circle" // postgres
    | "path" // postgres
    | "polygon"; // postgres

/**
 * column type used for identifier
 */
export type IdentifierColumnType = "uuid" // postgres
    | "uniqueidentifier"; // mssql
/**
 * column type with string data format
 */
export type DataStringColumnType = "xml" // mssql, postgres
    | "json" // mysql, postgres
    | "jsonb"; // postgres

export type EnumColumnType = "enum"; // mysql, postgres
/**
 * All other regular column types.
 */
export type OtherColumnType = "rowid" // oracle
    | "urowid" // oracle
    | "cidr" // postgres
    | "inet" // postgres
    | "macaddr"// postgres
    | "bit" // postgres
    | "bit varying" // postgres
    | "varbit"// postgres
    | "tsvector" // postgres
    | "tsquery" // postgres
    | "varbinary" // mssql
    | "cursor" // mssql
    | "hierarchyid" // mssql
    | "sql_variant" // mssql
    | "table"; // mssql

/**
 * Any column type column can be.
 */
export type ColumnType = IntColumnType
    | DecimalColumnType
    | DateColumnType
    | TimeColumnType
    | TimestampColumnType
    | BinaryColumnType
    | StringColumnType
    | TextColumnType
    | BooleanColumnType
    | GeometricColumnType
    | IdentifierColumnType
    | DataStringColumnType
    | EnumColumnType
    | OtherColumnType;

export type ColumnTypeMapKey = ColumnType | "defaultString" | "defaultNumberic"
    | "defaultDecimal" | "defaultBoolean" | "defaultBinary" | "defaultDataString"
    | "defaultDate" | "defaultTime" | "defaultEnum" | "defaultIdentifier" | "defaultTimestamp";

export type ColumnGroupType = "String" | "Boolean" | "Numeric" | "Decimal" | "Binary" | "DataString"
    | "Date" | "Time" | "Enum" | "Identifier" | "Timestamp";
