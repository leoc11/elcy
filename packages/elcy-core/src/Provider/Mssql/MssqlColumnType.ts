export type MssqlInt = "int" | "tinyint" | "smallint" | "bigint";
export type MssqlReal = "float" | "real" | "double precision";
export type MssqlDecimal = "decimal" | "numeric" | "smallmoney" | "money";
export type MssqlDate = "date";
export type MssqlDateTime = "datetime" | "datetime2" | "smalldatetime" | "datetimeoffset";
export type MssqlTime = "time";
export type MssqlRowVersion = "rowversion";
export type MssqlBinary = "binary" | "varbinary" | "image";
export type MssqlString = "nvarchar" | "varchar" | "char" | "nchar" | "text" | "ntext";
export type MssqlBoolean = "bit";
export type MssqlSpacial = "geometry" | "geography";
export type MssqlIdentifier = "uniqueidentifier";
export type MssqlSerialize = "xml";
type MssqlOther = "cursor" | "hierarchyid" | "sql_variant" | "table";
export type MssqlColumnType = MssqlInt | MssqlDecimal | MssqlReal | MssqlDate
    | MssqlDateTime | MssqlTime | MssqlRowVersion | MssqlBinary | MssqlString
    | MssqlBoolean | MssqlSpacial | MssqlIdentifier | MssqlSerialize | MssqlOther;
