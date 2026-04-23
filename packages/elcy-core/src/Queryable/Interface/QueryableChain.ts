import type { Queryable } from "../Queryable";
import type { Enumerable, GroupedEnumerable } from "@elcy/enumerable";
import type { Temporal } from "@js-temporal/polyfill";
import type Decimal from "decimal.js";
import { IGroupArray } from "src/Common/IGroupArray";
import { ValueType } from "src/Common/Type";

export type QueryableChain<T> = T extends Queryable<infer U> ? QueryableArrayChain<U> & QueryChainMarker<T>
    : T extends GroupedEnumerable<infer K, infer U> ? QueryableGroupArrayChain<K, U> & QueryChainMarker<T>
    : T extends Enumerable<infer U> ? QueryableArrayChain<U> & QueryChainMarker<T>
    : T extends IGroupArray<infer U, infer K> ? QueryableGroupArrayChain<K, U> & QueryChainMarker<T>
    : T extends Array<infer U> ? QueryableArrayChain<U> & QueryChainMarker<T>
    : T extends MainValueType ? T
    : T extends object ? QueryableObjectChain<T>
    : T;

export type Unchain<T> = T extends QueryChainMarker<infer U> ? U
    : T extends GroupedEnumerable<infer K, infer U> ? IGroupArray<K, U>
    : T extends Enumerable<infer U> ? Unchain<U>[]
    : T extends Array<infer U> ? Unchain<U>[]
    : T extends Record<string, unknown> ? { [P in keyof T]: Unchain<T[P]> }
    : T;

declare const type: unique symbol;
type QueryChainMarker<T> = {
    [type]: T
};
type MainValueType = number | bigint | string | boolean | Date | ArrayBufferView | ArrayBuffer | Temporal.Instant | Temporal.PlainDate | Temporal.PlainTime | Decimal;
type QueryableObjectChain<T extends object> = {
    [P in keyof T]-?
    : NonNullable<T[P]> extends GroupedEnumerable<infer K, infer U> ? QueryableGroupArrayChain<K, U> & QueryChainMarker<T[P]>
    : NonNullable<T[P]> extends Enumerable<infer U> ? QueryableArrayChain<U> & QueryChainMarker<T[P]>
    : NonNullable<T[P]> extends Array<infer U> ? QueryableArrayChain<U> & QueryChainMarker<T[P]>
    : NonNullable<T[P]> extends MainValueType ? T[P]
    : NonNullable<T[P]> extends object ? QueryableObjectChain<NonNullable<T[P]>>
    : T[P];
} & QueryChainMarker<T>;
type QueryableArrayChain<T> = Enumerable<QueryableChain<T>> & { withRelated: (...includes: Array<(item: QueryableChain<T>) => Exclude<object, ValueType>>) => QueryableArrayChain<T> };
type QueryableGroupArrayChain<K, T> = Enumerable<QueryableChain<T>> & { key: QueryableChain<K>, withRelated: (...includes: Array<(item: QueryableChain<T>) => Exclude<object, ValueType>>) => QueryableArrayChain<T> };
