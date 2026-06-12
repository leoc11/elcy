import type { Querify } from "src/Queryable/Interface/Querify";
import type { IExpression } from "../ExpressionBuilder/Expression/IExpression";

export type StringKeyOf<T> = Extract<keyof T, string>;
export type PrimitiveType<T = unknown, TArgs extends readonly unknown[] = unknown[]> = { (...values: TArgs): T; };
export type IObjectType<T = unknown, TArgs extends readonly unknown[] = unknown[]> = { new(...values: TArgs): T; };
export type GenericType<T = unknown, TArgs extends readonly unknown[] = unknown[]> = PrimitiveType<T, TArgs> | IObjectType<T, TArgs>;
export type InferType<T> = T extends PrimitiveType<T> ? ReturnType<T> : T extends IObjectType<T> ? InstanceType<T> : never;
export type IEnumType<T extends string | number> = { [key: string]: T; };
export type PivotD<TE, TD extends { [key: string]: (item: Querify<TE>) => ValueType }> = { [key in StringKeyOf<TD>]: ReturnType<TD[key]> };
export type PivotM<TE, TM extends { [key: string]: (item: Querify<TE[]>) => ValueType }> = { [key in StringKeyOf<TM>]: ReturnType<TM[key]> };
export type Pivot<TE,
    TD extends { [key: string]: (item: Querify<TE>) => ValueType },
    TM extends { [key: string]: (item: Querify<TE[]>) => ValueType }>
    = PivotD<TE, TD> & PivotM<TE, TM>;
export type ObjectLike<T> = { [key in keyof T]?: T[key] };
export type FlatObjectLike<T> = { [K in keyof T as T[K] extends ValueType ? K : never]?: Extract<T[K], ValueType> };
export type FlatObjectValue<T> = KeyValue<FlatObjectLike<T>, ValueType>;
export type PropertySelector<TE> = StringKeyOf<TE> | ((source: TE) => ValueType | undefined);
export type KeysExceptType<TE, TVal> = { [P in StringKeyOf<TE>]: TE[P] extends TVal ? never : P }[StringKeyOf<TE>];
export type KeysType<TE, TVal> = { [P in StringKeyOf<TE>]: TE[P] extends TVal ? P : never }[StringKeyOf<TE>];
export type KeyValue<TE, TVal = ValueType> = Extract<TE[keyof TE], TVal>;
export type TypeItem<T> = (T extends Array<(infer U)> ? U : T);

export type StringKeyOfValue<T, V> = {
    [K in keyof T]-?: K extends string ? T[K] extends V ? K : never : never;
}[keyof T];
export type PropertySelectorType<TE, T = ValueType> = ((source: TE) => T | undefined) | StringKeyOfValue<TE, T>;
export type RelationSelector<TSource, TTarget, T = ValueType> = T extends any ? [PropertySelectorType<TSource, T>, PropertySelectorType<TTarget, T>] : never;
export type RealValueType = RealValueTypeRegistry[keyof RealValueTypeRegistry];
export type IntValueType = IntValueTypeRegistry[keyof IntValueTypeRegistry];
export type BigIntValueType = BigIntValueTypeRegistry[keyof BigIntValueTypeRegistry];
export type DecimalValueType = DecimalValueTypeRegistry[keyof DecimalValueTypeRegistry];
export type NumberValueType = IntValueType | BigIntValueType | RealValueType | DecimalValueType;
export type DateValueType = DateValueTypeRegistry[keyof DateValueTypeRegistry];
export type TimeValueType = TimeValueTypeRegistry[keyof TimeValueTypeRegistry];
export type DateTimeValueType = DateTimeValueTypeRegistry[keyof DateTimeValueTypeRegistry];
export type ValueType = ValueTypeRegistry[keyof ValueTypeRegistry];
export type DbValue = string | number | boolean | null | bigint | Date | Uint8Array;
export type ArrayView = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array
    | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | ArrayBufferView;
export type ElementType<T> = T extends (infer K)[] ? K : never;
export type MethodKey<T> = { [K in StringKeyOf<T>]: T[K] extends (...args: unknown[]) => unknown ? K : never; }[StringKeyOf<T>];
export type MethodReturnType<T, K extends StringKeyOf<T>> = T[K] extends (...args: unknown[]) => infer R ? R : never;
export type SetterObj<TE, T extends TE[keyof TE] = TE[keyof TE]> = { [K in keyof TE]?: IExpression<T> }

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

export type RawSchema = Record<string, GenericType<ValueType>>;
export type RawSchemaType<T extends RawSchema> = {
    [K in keyof T]: T[K] extends NumberConstructor ? number
    : T[K] extends StringConstructor ? string
    : T[K] extends BooleanConstructor ? boolean
    : T[K] extends BigIntConstructor ? bigint
    : T[K] extends DateConstructor ? Date
    : T[K] extends GenericType<infer U> ? U : never;
};
