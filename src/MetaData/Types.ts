// tslint:disable-next-line:interface-name
export interface objectType<T> { new(value?: T): T; }
export type genericType<T> = objectType<T> | ((value?: T) => T);
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
    RESTRICT,
    CASCADE,
    SETNULL,
    NOACTION,
    SETDEFAULT
}
