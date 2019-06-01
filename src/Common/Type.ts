import { TimeSpan } from "../Data/TimeSpan";
import { Uuid } from "../Data/Uuid";
export interface IObjectType<T = any> { new(...values: any[]): T; name?: string; }
export interface IEnumType<T extends string | number> { [key: string]: T; }
export const NullConstructor: () => null = () => null;
export type Pivot<T,
    TD extends { [key: string]: (item: T) => ValueType },
    TM extends { [key: string]: (item: T[]) => ValueType }>
    = { [key in keyof TD]: ReturnType<TD[key]> } & { [key in keyof TM]: ReturnType<TM[key]> };
export type GenericType<T = any> = IObjectType<T> | ((...value: any[]) => T);
export type ObjectLike<T> = { [key in keyof T]?: T[key] };
export type FlatObjectLike<T> = { [key in keyof T]?: T[key] & ValueType };
export type PropertySelector<TE> = keyof TE | ((source: TE) => ValueType);
export type KeysExceptType<T, TProp> = { [P in keyof T]: T[P] extends TProp ? never : P }[keyof T];
export type KeysType<T, TProp> = { [P in keyof T]: T[P] extends TProp ? P : never }[keyof T];
export type TypeItem<T> = (T extends Array<(infer U)> ? U : T);
export type ValueType = number | string | boolean | Date | TimeSpan | Uuid | ArrayBufferView;
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
export type OrderDirection = "ASC" | "DESC";
export type TimeZoneHandling = "none" | "utc";
export type JoinType = "INNER" | "FULL" | "RIGHT" | "LEFT" | "CROSS";
export type ReferenceOption = "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
export type IsolationLevel = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ"
    | "SERIALIZABLE" | "SNAPSHOT";
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
    Unknown = 0,
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
export type DeleteMode = "soft" | "hard";
export type ArrayView = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array
    | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | ArrayBufferView;
