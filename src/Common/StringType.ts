export type DbType = "sqlite" | "mssql" | "postgresql" | "mysql";
export type RelationshipType = "one" | "many";
export type CompleteRelationshipType = "one-one" | "one-many" | "many-one" | "many-many";
export type OrderDirection = "ASC" | "DESC";
export type TimeZoneHandling = "none" | "utc";
export type JoinType = "INNER" | "FULL" | "RIGHT" | "LEFT" | "CROSS";
export type ReferenceOption = "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
export type IsolationLevel = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ"
    | "SERIALIZABLE" | "SNAPSHOT";
export type ConcurrencyModel = "NONE" | "PESSIMISTIC" | "OPTIMISTIC DIRTY" | "OPTIMISTIC VERSION";
export type LockMode = "READ" | "WRITE" | "UPGRADE" | "NONE";
export type DeleteMode = "soft" | "hard";
