import type { TimeSpan } from "../Data/TimeSpan";
import type { Uuid } from "../Data/Uuid";
import type { IExpression } from "../ExpressionBuilder/Expression/IExpression";

export type StringKeyOf<T> = Extract<keyof T, string>;
export type IObjectType<T = unknown> = { new(...values: unknown[]): T; };
export type IEnumType<T extends string | number> = { [key: string]: T; };
export type Pivot<T,
    TD extends { [key: string]: (item: T) => ValueType },
    TM extends { [key: string]: (item: T[]) => ValueType }>
    = { [key in StringKeyOf<TD>]: ReturnType<TD[key]> } & { [key in StringKeyOf<TM>]: ReturnType<TM[key]> };
export type GenericType<T = unknown> = { (...values: unknown[]): T; } | IObjectType<T>;
export type ObjectLike<T> = { [key in keyof T]?: T[key] };
export type FlatObjectLike<T> = { [key in keyof T]?: T[key] & ValueType };
export type PropertySelector<TE> = StringKeyOf<TE> | ((source: TE) => ValueType);
export type KeysExceptType<T, TProp> = { [P in StringKeyOf<T>]: T[P] extends TProp ? never : P }[StringKeyOf<T>];
export type KeysExtractType<T, TProp> = { [P in StringKeyOf<T>]: T[P] extends TProp ? P : never }[StringKeyOf<T>];
export type KeysType<T, TProp> = { [P in StringKeyOf<T>]: T[P] extends TProp ? P : never }[StringKeyOf<T>];
export type TypeItem<T> = (T extends Array<(infer U)> ? U : T);
export type ArrayView = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array
    | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | ArrayBufferView;
export type ValueType = number | string | boolean | Number | String | Boolean | Date | TimeSpan | Uuid | ArrayView | ArrayBuffer;
export type ElementType<T> = T extends (infer K)[] ? K : never;
export type MethodKey<T> = { [K in StringKeyOf<T>]: T[K] extends (...args: unknown[]) => unknown ? K : never; }[StringKeyOf<T>];
export type MethodReturnType<T, K extends StringKeyOf<T>> = T[K] extends (...args: unknown[]) => infer R ? R : never;
export type SetterObj<T> = { [K in StringKeyOf<T>]?: IExpression<ValueType> }

export type Merge<T1, T2> = {
    [K in StringKeyOf<T1> | StringKeyOf<T2>]: 
        K extends StringKeyOf<T1>
        ? K extends StringKeyOf<T2>
            ? T1[K] | T2[K]
            : T1[K]
        : K extends StringKeyOf<T2>
            ? T2[K]
            : never;
};
