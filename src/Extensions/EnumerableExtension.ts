import "../Enumerable/Enumerable.partial";
import { Enumerable } from "../Enumerable/Enumerable";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { IOrderDefinition } from "../Enumerable/Interface/IOrderDefinition";
import { IObjectType, ValueType, GenericType } from "../Common/Type";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        toArray(): T[];
        cast<TReturn>(): TReturn[];
        asEnumerable(): Enumerable<T>;
        select<TReturn>(type: IObjectType<TReturn>, selector: ((item: T) => TReturn)): Enumerable<TReturn>;
        select<TReturn>(selector: ((item: T) => TReturn)): Enumerable<TReturn>;
        select<TReturn>(typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)): Enumerable<TReturn>;
        selectMany<TReturn>(fn: (item: T) => Iterable<TReturn>): Enumerable<TReturn>;
        contains(item: T): boolean;
        first(fn?: (item: T) => boolean): T;
        where(fn: (item: T) => boolean): Enumerable<T>;
        orderBy(...selectors: IOrderDefinition<T>[]): Enumerable<T>;
        any(fn?: (item: T) => boolean): boolean;
        all(fn: (item: T) => boolean): boolean;
        skip(n: number): Enumerable<T>;
        take(n: number): Enumerable<T>;
        sum(fn?: (item: T) => number): number;
        count(): number;
        avg(fn?: (item: T) => number): number;
        max(fn?: (item: T) => number): number;
        min(fn?: (item: T) => number): number;
        groupBy<K>(fn: (item: T) => K): Enumerable<GroupedEnumerable<T, K>>;
        distinct<TKey>(fn?: (item: T) => TKey): Enumerable<T>;
        innerJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        leftJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2 | null) => TResult): Enumerable<TResult>;
        rightJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2) => TResult): Enumerable<TResult>;
        fullJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2 | null) => TResult): Enumerable<TResult>;
        groupJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2[]) => TResult): Enumerable<TResult>;
        union(array2: Iterable<T>, all?: boolean): Enumerable<T>;
        /**
         * Return array of item exist in both source array and array2.
         */
        intersect(array2: Iterable<T>): Enumerable<T>;
        /**
         * Return array of item exist in both source array and array2.
         */
        except(array2: Iterable<T>): Enumerable<T>;
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }, TResult extends { [key in (keyof TD & keyof TM)]: ValueType }>(dimensions: TD, metric: TM): Enumerable<TResult>;
    
        // Helper Extension
        ofType<TR>(type: GenericType<TR>): Enumerable<TR>;
    }
    interface Map<K, V> {
        asEnumerable(): Enumerable<[K, V]>;
    }
}

Map.prototype.asEnumerable = function <K, V>(this: Map<K, V>) {
    return Enumerable.from(this);
};
Array.prototype.toArray = function <T>(this: T[]) {
    return this as T[];
};
Array.prototype.cast = function <T extends TTarget, TTarget>(this: T[]) {
    return this as TTarget[];
};
Array.prototype.asEnumerable = function <T>(this: T[]) {
    return Enumerable.from(this);
};
Array.prototype.selectMany = function <T>(this: T[], selector: (item: T) => any[] | Enumerable) {
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
Array.prototype.orderBy = function <T>(this: T[], ...selectors: IOrderDefinition<T>[]) {
    return this.asEnumerable().orderBy(...selectors);
};
Array.prototype.first = function <T>(this: T[], predicate?: (item: T) => boolean) {
    return predicate ? this.where(predicate).first() : this[0];
};
Array.prototype.any = function <T>(this: T[], predicate: (item: T) => boolean = o => true) {
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
Array.prototype.max = function <T>(this: T[], selector?: (item: T) => number) {
    return selector ? this.select(selector).max() : Math.max.apply(Math, this);
};

Array.prototype.min = function <T>(this: T[], selector?: (item: T) => number) {
    return selector ? this.select(selector).min() : Math.min.apply(Math, this);
};
Array.prototype.count = function <T>(this: T[], predicate?: (item: T) => boolean) {
    return predicate ? this.asEnumerable().count(predicate) : this.length;
};
Array.prototype.groupBy = function <T, TKey>(this: T[], keySelector: (item: T) => TKey): Enumerable<GroupedEnumerable<T, TKey>> {
    return this.asEnumerable().groupBy(keySelector);
};
Array.prototype.distinct = function <T>(this: T[], fn?: (item: T) => any) {
    return this.asEnumerable().distinct(fn);
};
Array.prototype.innerJoin = function <T, T2, TResult>(this: T[], array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2) => TResult) {
    return this.asEnumerable().innerJoin(array2, relation, resultSelector);
};
Array.prototype.leftJoin = function <T, T2, TResult>(this: T[], array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2 | null) => TResult) {
    return this.asEnumerable().leftJoin(array2, relation, resultSelector);
};
Array.prototype.rightJoin = function <T, T2, TResult>(this: T[], array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2) => TResult) {
    return this.asEnumerable().rightJoin(array2, relation, resultSelector);
};
Array.prototype.fullJoin = function <T, T2, TResult>(this: T[], array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2 | null) => TResult) {
    return this.asEnumerable().fullJoin(array2, relation, resultSelector);
};
Array.prototype.groupJoin = function <T, T2, TResult>(this: T[], array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2[]) => TResult) {
    return this.asEnumerable().groupJoin(array2, relation, resultSelector);
};
Array.prototype.union = function <T>(this: T[], array2: Iterable<T>, isUnionAll: boolean = false) {
    return this.asEnumerable().union(array2, isUnionAll);
};
Array.prototype.intersect = function <T>(this: T[], array2: Iterable<T>) {
    return this.asEnumerable().intersect(array2);
};
Array.prototype.except = function <T>(this: T[], array2: Iterable<T>) {
    return this.asEnumerable().except(array2);
};
Array.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }, TResult extends { [key in (keyof TD & keyof TM)]: ValueType }>(this: T[], dimensions: TD, metrics: TM): Enumerable<TResult> {
    return this.asEnumerable().pivot(dimensions, metrics);
};

Array.prototype.ofType = function <T, TR>(this: T[], type: GenericType<TR>): Enumerable<TR> {
    return this.asEnumerable().ofType(type);
};
