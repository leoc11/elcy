import { TimeSpan } from "../Data/TimeSpan";
import { Uuid } from "../Data/Uuid";

export type IObjectType<T = unknown> = { new(...values: unknown[]): T; };
export type IEnumType<T extends string | number> = { [key: string]: T; };
export type Pivot<T,
    TD extends { [key: string]: (item: T) => ValueType },
    TM extends { [key: string]: (item: T[]) => ValueType }>
    = { [key in Extract<keyof TD, string>]: ReturnType<TD[key]> } & { [key in Extract<keyof TM, string>]: ReturnType<TM[key]> };
export type GenericType<T = unknown> = { (...values: unknown[]): T; } | IObjectType<T> | ArrayConstructor;
export type ObjectLike<T> = { [key in keyof T]?: T[key] };
export type FlatObjectLike<T> = { [key in keyof T]?: T[key] & ValueType };
export type PropertySelector<TE> = keyof TE | ((source: TE) => ValueType);
export type KeysExceptType<T, TProp> = { [P in keyof T]: T[P] extends TProp ? never : P }[keyof T];
export type StringKeyOf<T> = Extract<keyof T, string>;
export type KeysType<T, TProp> = { [P in StringKeyOf<T>]: T[P] extends TProp ? P : never }[StringKeyOf<T>];
export type TypeItem<T> = (T extends Array<(infer U)> ? U : T);
export type ValueType = number | string | boolean | Date | TimeSpan | Uuid | ArrayBufferView;
export type ArrayView = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array
    | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | ArrayBufferView;
export type ElementType<T> = T extends (infer K)[] ? K : never;
export type MethodKey<T> = { [K in Extract<keyof T, string>]: T[K] extends (...args: unknown[]) => unknown ? K : never; }[Extract<keyof T, string>];
export type MethodReturnType<T, K extends Extract<keyof T, string>> = T[K] extends (...args: unknown[]) => infer R ? R : never;

export type Merge<T1, T2> = {
    [K in Extract<keyof T1, string> | Extract<keyof T2, string>]: 
        K extends Extract<keyof T1, string>
        ? K extends Extract<keyof T2, string>
            ? T1[K] | T2[K]
            : T1[K]
        : K extends Extract<keyof T2, string>
            ? T2[K]
            : never;
};