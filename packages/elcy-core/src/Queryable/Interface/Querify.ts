import type { Queryable } from "../Queryable";
import type { Enumerable, GroupedEnumerable, IEnumerable, IOrderDefinition } from "@elcy/enumerable";
import type { IGroupArray } from "src/Common/IGroupArray";
import type { ValueType } from "src/Common/Type";

export type Querify<T = unknown> = T extends Queryable<infer U> ? QuerifySet<U>
    : T extends GroupedEnumerable<infer K, infer U> ? GroupQuerifySet<K, U>
    : T extends Enumerable<infer U> ? QuerifySet<U>
    : T extends IGroupArray<infer K, infer U> ? GroupQuerifySet<K, U>
    : T extends Array<infer U> ? QuerifySet<U>
    : T extends IEnumerable<infer U> ? QuerifySet<U>
    : T extends ValueType ? T
    : T extends object ? QuerifyObject<T>
    : T;

export type Unquerify<T> = T extends QuerifyMarker<infer U> ? U
    : T extends GroupedEnumerable<infer K, infer U> ? IGroupArray<K, U>
    : T extends Enumerable<infer U> ? Unquerify<U>[]
    : T extends Record<string, unknown> ? { [P in keyof T]: Unquerify<T[P]> }
    : T extends GroupQuerifySet<infer K, infer U> ? IGroupArray<Unquerify<K>, Unquerify<U>>
    : T extends QuerifySet<infer U> ? Unquerify<U>[]
    : T;

declare const type: unique symbol;
type QuerifyMarker<T = unknown> = {
    [type]: T
};
type QuerifyObject<T extends object> = {
    [P in keyof T]-?
    : NonNullable<T[P]> extends GroupedEnumerable<infer K, infer U> ? GroupQuerifySet<K, U>
    : NonNullable<T[P]> extends Enumerable<infer U> ? QuerifySet<U>
    : NonNullable<T[P]> extends IGroupArray<infer K, infer U> ? GroupQuerifySet<K, U>
    : NonNullable<T[P]> extends Array<infer U> ? QuerifySet<U>
    : NonNullable<T[P]> extends ValueType ? T[P]
    : NonNullable<T[P]> extends object ? QuerifyObject<NonNullable<T[P]>>
    : T[P];
} & QuerifyMarker<T>;


export type QuerifySet<T> = {
    crossJoin<T2, TResult>(array2: QuerifySet<T2> | IEnumerable<T2> | Queryable<T2>, resultSelector?: (item1: Querify<T> | null, item2: Querify<T2> | null) => TResult): QuerifySet<TResult>;

    distinct(): QuerifySet<T>;

    fullJoin<T2, TResult>(array2: QuerifySet<T2> | IEnumerable<T2> | Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T> | null, item2: Querify<T2> | null) => TResult): QuerifySet<TResult>;

    groupBy<K>(keySelector: (item: Querify<T>) => K): QuerifySet<IGroupArray<K, T>>;

    groupJoin<T2, TResult>(array2: QuerifySet<T2> | IEnumerable<T2> | Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T>, item2: QuerifySet<T2>) => TResult): QuerifySet<TResult>;

    withRelated(...includes: Array<(item: Querify<T>) => Exclude<object, ValueType>>): QuerifySet<T>;

    innerJoin<T2, TResult>(array2: QuerifySet<T2> | IEnumerable<T2> | Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T>, item2: Querify<T2>) => TResult): QuerifySet<TResult>;

    leftJoin<T2, TResult>(array2: QuerifySet<T2> | IEnumerable<T2> | Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T>, item2: Querify<T2> | null) => TResult): QuerifySet<TResult>;

    orderBy(...selectors: Array<IOrderDefinition<T>>): QuerifySet<T>;

    rightJoin<T2, TResult>(array2: QuerifySet<T2> | IEnumerable<T2> | Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T> | null, item2: Querify<T2>) => TResult): QuerifySet<TResult>;

    map<TReturn>(selector: (item: Querify<T>) => TReturn): QuerifySet<Unquerify<TReturn>>;

    flatMap<TReturn>(selector: (item: Querify<T>) => QuerifySet<TReturn> | IEnumerable<TReturn> | Queryable<TReturn>): QuerifySet<Unquerify<TReturn>>;

    slice(start: number, end?: number): QuerifySet<T>;

    join: T extends string ? (separator?: string) => string : never;
    union(...items: [QuerifySet<T>, ...QuerifySet<T>[]]): QuerifySet<T>;
    intersect(...items: [QuerifySet<T>, ...QuerifySet<T>[]]): QuerifySet<T>;
    except(...items: [QuerifySet<T>, ...QuerifySet<T>[]]): QuerifySet<T>;
    concat(...items: [QuerifySet<T>, ...QuerifySet<T>[]]): QuerifySet<T>;

    filter(predicate: (item: Querify<T>) => boolean): QuerifySet<T>;

    every(predicate: (item: Querify<T>) => boolean): boolean;
    some(predicate?: (item: Querify<T>) => boolean): boolean;
    includes(item: Querify<T>): boolean;
    count(predicate?: (item: Querify<T>) => boolean): number;
    find(predicate?: (item: Querify<T>) => boolean): T | undefined;
    max<
        TArgs extends T extends ValueType
        ? [selector?: (item: Querify<T>) => ValueType]
        : [selector: (item: Querify<T>) => ValueType],
        TResult extends TArgs extends [undefined?] ? T : ReturnType<TArgs[0]>,
    >(...args: TArgs): TResult;
    min<
        TArgs extends T extends ValueType
        ? [selector?: (item: Querify<T>) => ValueType]
        : [selector: (item: Querify<T>) => ValueType] = T extends ValueType
        ? [selector?: (item: Querify<T>) => ValueType]
        : [selector: (item: Querify<T>) => ValueType],
        TResult extends TArgs extends [undefined?] ? T : ReturnType<TArgs[0]> =
        TArgs extends [undefined?] ? T : ReturnType<TArgs[0]>,
    >(...args: TArgs): TResult;
    sum<
        TArgs extends T extends number | bigint
        ? [selector?: (item: Querify<T>) => number | bigint]
        : [selector: (item: Querify<T>) => number | bigint],
        TResult extends TArgs extends [undefined?] ? T : ReturnType<TArgs[0]>,
    >(...args: TArgs): TResult;
    avg<
        TArgs extends T extends number | bigint
        ? [selector?: (item: Querify<T>) => number | bigint]
        : [selector: (item: Querify<T>) => number | bigint],
        TResult extends TArgs extends [undefined?] ? T : ReturnType<TArgs[0]>,
    >(...args: TArgs): TResult | null;
    toArray(): QuerifySet<T>;
} & Iterable<T>;

export type GroupQuerifySet<K, T> = QuerifySet<T> & {
    key: Querify<K>;
}