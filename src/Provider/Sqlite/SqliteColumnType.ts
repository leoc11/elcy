export type SqliteInt = "integer";
export type SqliteReal = "real";
export type SqliteDecimal = "numeric";
export type SqliteDate = "text";
export type SqliteDateTime = "text";
export type SqliteTime = "text";
export type SqliteRowVersion = "text";
export type SqliteBinary = "blob";
export type SqliteString = "text";
export type SqliteBoolean = "integer";
export type SqliteSpacial = "text";
export type SqliteIdentifier = "text";
export type SqliteSerialize = "text";
export type SqliteEnum = "text";
export type SqliteColumnType = SqliteInt | SqliteDecimal | SqliteReal | SqliteDate
    | SqliteDateTime | SqliteTime | SqliteRowVersion | SqliteBinary | SqliteString
    | SqliteBoolean | SqliteSpacial | SqliteIdentifier | SqliteSerialize | SqliteEnum;
