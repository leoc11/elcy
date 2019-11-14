import { GenericType, IObjectType, Pivot, ValueType } from "../Common/Type";
import { Enumerable } from "../Enumerable/Enumerable";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { IOrderDefinition } from "../Enumerable/Interface/IOrderDefinition";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        all(fn: (item: T) => boolean): boolean;
        any(fn?: (item: T) => boolean): boolean;
        asEnumerable(): Enumerable<T>;
        avg(fn?: (item: T) => number): number;
        cast<TReturn>(): TReturn[];
        contains(item: T): boolean;
        count(): number;
        crossJoin<T2, TResult>(array2: IEnumerable<T2>, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        distinct<TKey>(fn?: (item: T) => TKey): Enumerable<T>;
        /**
         * Return array of item exist in both source array and array2.
         */
        except(array2: IEnumerable<T>): Enumerable<T>;
        first(fn?: (item: T) => boolean): T;
        fullJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2 | null) => TResult): Enumerable<TResult>;
        groupBy<K>(fn: (item: T) => K): Enumerable<GroupedEnumerable<K, T>>;
        groupJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2[]) => TResult): Enumerable<TResult>;
        innerJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        /**
         * Return array of item exist in both source array and array2.
         */
        intersect(array2: IEnumerable<T>): Enumerable<T>;
        leftJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2 | null) => TResult): Enumerable<TResult>;
        max(fn?: (item: T) => number): number;
        min(fn?: (item: T) => number): number;
        ofType<TR>(type: GenericType<TR>): Enumerable<TR>;
        orderBy(...selectors: Array<IOrderDefinition<T>>): Enumerable<T>;
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }, TResult extends { [key in (keyof TD & keyof TM)]: ValueType }>(dimensions: TD, metric: TM): Enumerable<TResult>;
        rightJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2) => TResult): Enumerable<TResult>;
        select<TReturn>(type: IObjectType<TReturn>, selector: ((item: T) => TReturn)): Enumerable<TReturn>;
        select<TReturn>(selector: ((item: T) => TReturn)): Enumerable<TReturn>;
        select<TReturn>(typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)): Enumerable<TReturn>;
        selectMany<TReturn>(fn: (item: T) => Iterable<TReturn>): Enumerable<TReturn>;
        skip(n: number): Enumerable<T>;
        sum(fn?: (item: T) => number): number;
        take(n: number): Enumerable<T>;
        toArray(): T[];
        toMap<K, V = T>(keySelector: (item: T) => K, valueSelector?: (item: T) => V): Map<K, V>;
        union(array2: IEnumerable<T>, all?: boolean): Enumerable<T>;
        where(fn: (item: T) => boolean): Enumerable<T>;
    }
    interface Map<K, V> {
        asEnumerable(): Enumerable<[K, V]>;
    }
}

Map.prototype.asEnumerable = function <K, V>(this: Map<K, V>) {
    return Enumerable.from(this);
};
Array.prototype.toArray = function <T>(this: T[]) {
    return Array.from(this);
};
Array.prototype.cast = function <T extends TTarget, TTarget>(this: T[]) {
    return this as TTarget[];
};
Array.prototype.asEnumerable = function <T>(this: T[]) {
    return Enumerable.from(this);
};
Array.prototype.selectMany = function <T, R>(this: T[], selector: (item: T) => Iterable<R>) {
    return this.asEnumerable().selectMany(selector);
};
Array.prototype.select = function <T, TReturn>(this: T[], typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)) {
    return this.asEnumerable().select(typeOrSelector, selector);
};
Array.prototype.contains = function <T>(this: T[], item: T) {
    return this.indexOf(item) >= 0;
};
Array.prototype.where = function <T>(this: T[], predicate: (item: T) => boolean) {
    return this.asEnumerable().where(predicate);
};
Array.prototype.orderBy = function <T>(this: T[], ...selectors: Array<IOrderDefinition<T>>) {
    return this.asEnumerable().orderBy(...selectors);
};
Array.prototype.first = function <T>(this: T[], predicate?: (item: T) => boolean) {
    return predicate ? this.where(predicate).first() : this[0];
};
Array.prototype.any = function <T>(this: T[], predicate: (item: T) => boolean = (o) => true) {
    return this.some(predicate);
};
Array.prototype.all = function <T>(this: T[], predicate: (item: T) => boolean) {
    return this.every(predicate);
};
Array.prototype.skip = function <T>(this: T[], skip: number) {
    return this.asEnumerable().skip(skip);
};
Array.prototype.take = function <T>(this: T[], take: number) {
    return this.asEnumerable().take(take);
};
Array.prototype.sum = function <T>(this: T[], selector?: (item: T) => number) {
    return selector ? this.select(selector).sum() : (this as any as number[]).reduce((a, b) => a + b, 0);
};
Array.prototype.avg = function <T>(this: T[], selector?: (item: T) => number) {
    return selector ? this.select(selector).avg() : this.sum() / this.count();
};
Array.prototype.max = function <T>(this: T[], selector?: (item: T) => number): number {
    return selector ? this.select(selector).max() : Math.max.apply(Math, this as unknown as number[]);
};

Array.prototype.min = function <T>(this: T[], selector?: (item: T) => number) {
    return selector ? this.select(selector).min() : Math.min.apply(Math, this as unknown as number[]);
};
Array.prototype.count = function <T>(this: T[], predicate?: (item: T) => boolean) {
    return predicate ? this.asEnumerable().count(predicate) : this.length;
};
Array.prototype.groupBy = function <T, K>(this: T[], keySelector: (item: T) => K): Enumerable<GroupedEnumerable<K, T>> {
    return this.asEnumerable().groupBy(keySelector);
};
Array.prototype.distinct = function <T>(this: T[], fn?: (item: T) => any) {
    return this.asEnumerable().distinct(fn);
};
Array.prototype.innerJoin = function <T, T2, TResult>(this: T[], array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2) => TResult) {
    return this.asEnumerable().innerJoin(array2, relation, resultSelector);
};
Array.prototype.leftJoin = function <T, T2, TResult>(this: T[], array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2 | null) => TResult) {
    return this.asEnumerable().leftJoin(array2, relation, resultSelector);
};
Array.prototype.rightJoin = function <T, T2, TResult>(this: T[], array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2) => TResult) {
    return this.asEnumerable().rightJoin(array2, relation, resultSelector);
};
Array.prototype.fullJoin = function <T, T2, TResult>(this: T[], array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2 | null) => TResult) {
    return this.asEnumerable().fullJoin(array2, relation, resultSelector);
};
Array.prototype.groupJoin = function <T, T2, TResult>(this: T[], array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2[]) => TResult) {
    return this.asEnumerable().groupJoin(array2, relation, resultSelector);
};
Array.prototype.crossJoin = function <T, T2, TResult>(this: T[], array2: IEnumerable<T2>, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult> {
    return this.asEnumerable().crossJoin(array2, resultSelector);
};
Array.prototype.union = function <T>(this: T[], array2: IEnumerable<T>, isUnionAll: boolean = false) {
    return this.asEnumerable().union(array2, isUnionAll);
};
Array.prototype.intersect = function <T>(this: T[], array2: IEnumerable<T>) {
    return this.asEnumerable().intersect(array2);
};
Array.prototype.except = function <T>(this: T[], array2: IEnumerable<T>) {
    return this.asEnumerable().except(array2);
};
Array.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(this: T[], dimensions: TD, metrics: TM): Enumerable<Pivot<T, TD, TM>> {
    return this.asEnumerable().pivot(dimensions, metrics);
};
Array.prototype.toMap = function <T, K, V>(this: T[], keySelector: (item: T) => K, valueSelector?: (item: T) => V) {
    const result = new Map();
    for (const item of this) {
        result.set(keySelector(item), valueSelector ? valueSelector(item) : item);
    }
    return result;
};
Array.prototype.ofType = function <T, TR>(this: T[], type: GenericType<TR>): Enumerable<TR> {
    return this.asEnumerable().ofType(type);
};
