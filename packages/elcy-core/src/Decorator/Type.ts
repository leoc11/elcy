import { IObjectType } from "src/Common/Type";

export type ClassAccessor<T> = { get(): T; set(v: T): void };
export type ClassDecorator<TC extends IObjectType> = (target: TC, context: ClassDecoratorContext<TC>) => void | TC;
export type ClassFieldDecorator<TE = any, T = any> = (value: undefined, context: ClassFieldDecoratorContext<TE, T>) => void;
export type ClassMethodDecorator<TE = any, T extends ((...args: any) => any) = ((...args: any) => any)> = (value: T, context: ClassMethodDecoratorContext<TE, T>) => void;
export type ClassGetterDecorator = (value: Function, context: ClassGetterDecoratorContext) => void;
export type ClassSetterDecorator = (value: Function, context: ClassSetterDecoratorContext) => void;
export type ClassAccessorDecorator<TE = any, T = any> = (value: ClassAccessor<T>, context: ClassAccessorDecoratorContext<TE, T>) => void | { get?(): T; set?(v: T): void; init?(initialValue: T): T; };
export type ClassPropertyDecorator<TE = any, T = any> = ClassFieldDecorator<TE, T | undefined> & ClassAccessorDecorator<TE, T | undefined>;

