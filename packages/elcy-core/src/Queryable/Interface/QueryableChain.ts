import { ValueType } from "src/Common/Type";
import type { Queryable } from "../Queryable";
import type { Enumerable } from "@elcy/enumerable";

export type QueryableObjectChain<T extends object> = {
    [P in keyof T]-?
    : NonNullable<T[P]> extends Enumerable<infer U> ? Enumerable<QueryableChain<U>>
    : NonNullable<T[P]> extends Array<infer U> ? Enumerable<QueryableChain<U>>
    : NonNullable<T[P]> extends ValueType ? T[P]
    : NonNullable<T[P]> extends object ? QueryableObjectChain<NonNullable<T[P]>>
    : T[P];
}
export type QueryableChain<T> = T extends Queryable<infer U> ? Enumerable<QueryableChain<U>>
    : T extends Enumerable<infer U> ? Enumerable<QueryableChain<U>>
    : T extends Array<infer U> ? Enumerable<QueryableChain<U>>
    : T extends object ? QueryableObjectChain<T>
    : T;