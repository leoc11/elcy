import type { Queryable } from "../Queryable";
import type { Enumerable } from "@elcy/enumerable";
import type { Temporal } from "@js-temporal/polyfill";
import type Decimal from "decimal.js";

type MainValueType = number | bigint | string | boolean | Date | ArrayBufferView | ArrayBuffer | Temporal.Instant | Temporal.PlainDate | Temporal.PlainTime | Decimal;

export type QueryableObjectChain<T extends object> = {
    [P in keyof T]-?
    : NonNullable<T[P]> extends Enumerable<infer U> ? Enumerable<QueryableChain<U>>
    : NonNullable<T[P]> extends Array<infer U> ? Enumerable<QueryableChain<U>>
    : NonNullable<T[P]> extends MainValueType ? T[P]
    : NonNullable<T[P]> extends object ? QueryableObjectChain<NonNullable<T[P]>>
    : T[P];
}
export type QueryableChain<T> = T extends Queryable<infer U> ? Enumerable<QueryableChain<U>>
    : T extends Enumerable<infer U> ? Enumerable<QueryableChain<U>>
    : T extends Array<infer U> ? Enumerable<QueryableChain<U>>
    : T extends object ? QueryableObjectChain<T>
    : T;