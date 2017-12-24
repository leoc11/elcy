// tslint:disable-next-line:interface-name
export interface IObjectType<T> { new(value?: any): T; }
export interface IEnumType<T extends string | number> { [key: string]: T; }
// tslint:disable-next-line:ban-types
export type genericType<T> = IObjectType<T> | ((value?: any) => T);
export const classBase = Reflect.getPrototypeOf(Function);
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
export enum RelationType {
    OneToOne,
    OneToMany
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
