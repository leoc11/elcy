import { TimeSpan } from "../Data/TimeSpan";
import { UUID } from "../Data/UUID";
export interface IObjectType<T = any> { name?: string; new(...values: any[]): T; }
export interface IEnumType<T extends string | number> { [key: string]: T; }
export const NullConstructor: () => null = () => null;
export type GenericType<T = any> = IObjectType<T> | ((...value: any[]) => T);
export type PropertySelector<T> = keyof T | ((source: T) => any);
export type ValueType = number | string | boolean | Date | TimeSpan | UUID;
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
export type OrderDirection  = "ASC" | "DESC";
export type TimeZoneHandling = "none" | "utc";

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
    /**
     * Data Query Language
     */
    DQL = 1,
    /**
     * Data Manipulation Language
     */
    DML = 2,
    /**
     * Data Definition Language
     */
    DDL = 4,
    /**
     * Data Transaction Language
     */
    DTL = 8,
    /**
     * Data Control Language
     */
    DCL = 16
}

export enum ColumnGeneration {
    None = 0,
    Insert = 1,
    Update = 2
}
export type DeleteMode = "Soft" | "Hard";