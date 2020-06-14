export enum DateTimeKind {
    UTC,
    Unspecified,
    Custom
}
export enum InheritanceType {
    TablePerClass,
    SingleTable,
    TablePerConcreteClass,
    None
}
export enum EventListenerType {
    /**
     * Run after entity completely loaded from database.
     */
    AFTER_GET = "after-get",
    /**
     * Run before insert or update.
     */
    BEFORE_SAVE = "before-save",
    /**
     * Run after insert or update success.
     */
    AFTER_SAVE = "after-save",
    /**
     * Run before soft delete or hard delete.
     */
    BEFORE_DELETE = "before-delete",
    /**
     * Run after soft delete or hard delete success.
     */
    AFTER_DELETE = "after-delete"
}

export enum QueryType {
    Unknown = 0,
    /**
     * Data Query Language
     */
    DQL = 1 << 0,
    /**
     * Data Manipulation Language
     */
    DML = 1 << 1,
    /**
     * Data Definition Language
     */
    DDL = 1 << 2,
    /**
     * Data Transaction Language
     */
    DTL = 1 << 3,
    /**
     * Data Control Language
     */
    DCL = 1 << 4
}

export enum ColumnGeneration {
    None = 0,
    Insert = 1 << 0,
    Update = 1 << 1
}
