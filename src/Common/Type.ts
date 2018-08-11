import { TimeSpan } from "./TimeSpan";
export interface IObjectType<T = any> { name?: string; new(...values: any[]): T; }
export interface IEnumType<T extends string | number> { [key: string]: T; }
export const NullConstructor: () => null = () => null;
export type GenericType<T = any> = IObjectType<T> | ((...value: any[]) => T);
export type PropertySelector<T> = keyof T | ((source: T) => any);
export type ValueType = number | string | Date | TimeSpan;
export type DbType = "sqlite" | "mssql" | "postgresql" | "mysql";
export type RelationshipType = "one" | "many";
export type CompleteRelationshipType = "one-one" | "one-many" | "many-one" | "many-many";
export const ClassBase = Object.getPrototypeOf(Function);
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
export enum OrderDirection {
    ASC = "ASC",
    DESC = "DESC"
}
export enum JoinType {
    INNER = "INNER",
    FULL = "FULL",
    RIGHT = "RIGHT",
    LEFT = "LEFT"
}
export type ReferenceOption = "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
export type IsolationLevel = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE" | "SNAPSHOT";
export type ConcurrencyModel = "NONE" | "PESSIMISTIC" | "OPTIMISTIC DIRTY" | "OPTIMISTIC VERSION";
export type LockMode = "READ" | "WRITE" | "UPGRADE" | "NONE";
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
    DQL = 1,
    DML = 2,
    DDL = 4,
    DTL = 8,
    DCL = 16
}

export enum ColumnGeneration {
    None = 0,
    Insert = 1,
    Update = 2
}
export type DeleteMode = "Soft" | "Hard";