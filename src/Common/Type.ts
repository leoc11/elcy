import { TimeSpan } from "./TimeSpan";
export interface IObjectType<T = any> { name?: string; new(...values: any[]): T; }
export interface IEnumType<T extends string | number> { [key: string]: T; }
export const NullConstructor: () => null = () => null;
export type GenericType<T = any> = IObjectType<T> | ((...value: any[]) => T);
export type ValueType = number | string | Date | TimeSpan;
export type RelationshipType = "one" | "many";
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
export enum ReferenceOption {
    RESTRICT = "restricted",
    CASCADE = "cascade",
    SET_NULL = "set-null",
    NO_ACTION = "no-action",
    SET_DEFAULT = "set-default"
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
