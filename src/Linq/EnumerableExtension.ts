import { OrderDirection } from "../Common/Type";
import { Enumerable } from "./Enumerable/Enumerable";
import "./Enumerable/Enumerable.partial";
import { GroupedEnumerable } from "./Enumerable/GroupedEnumerable";
// import { IGroupArray } from "./Interface/IGroupArray";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        asEnumerable(): Enumerable<T>;
        selectMany<TReturn>(fn: (item: T) => TReturn[] | Enumerable<TReturn>): Enumerable<TReturn>;
        select<TReturn>(fn: (item: T) => TReturn): Enumerable<TReturn>;
        contains(item: T): boolean;
        first(fn?: (item: T) => boolean): T;
        last(fn?: (item: T) => boolean): T;
        where(fn: (item: T) => boolean): Enumerable<T>;
        orderBy(fn: (item: T) => any, orderDirection: OrderDirection): Enumerable<T>;
        any(fn?: (item: T) => boolean): boolean;
        all(fn?: (item: T) => boolean): boolean;
        skip(n: number): Enumerable<T>;
        take(n: number): Enumerable<T>;
        sum(fn?: (item: T) => number): number;
        count(): number;
        avg(fn?: (item: T) => number): number;
        max(fn?: (item: T) => number): number;
        min(fn?: (item: T) => number): number;
        groupBy<K>(fn: (item: T) => K): Enumerable<GroupedEnumerable<T, K>>;
        distinct<TKey>(fn?: (item: T) => TKey): Enumerable<T>;
        innerJoin<T2, TKey, TResult>(array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        leftJoin<T2, TKey, TResult>(array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2 | null) => TResult): Enumerable<TResult>;
        rightJoin<T2, TKey, TResult>(array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2) => TResult): Enumerable<TResult>;
        fullJoin<T2, TKey, TResult>(array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2 | null) => TResult): Enumerable<TResult>;
        union(array2: T[], all: boolean): Enumerable<T>;
        /**
         * Return array of item exist in both source array and array2.
         */
        intersect(array2: T[]): Enumerable<T>;
        /**
         * Return array of item exist in both source array and array2.
         */
        except(array2: T[]): Enumerable<T>;
        pivot<TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }>(dimensions: TD, metric: TM): Enumerable<TResult>;
    }
}

Array.prototype.asEnumerable = function <T>(this: T[]) {
    return new Enumerable(this);
};
Array.prototype.selectMany = function <T>(this: T[], selector: (item: T) => any[] | Enumerable) {
    return this.asEnumerable().selectMany(selector);
};
Array.prototype.select = function <T>(this: T[], selector: (item: T) => any) {
    return this.asEnumerable().select(selector);
};
Array.prototype.contains = function <T>(this: T[], item: T) {
    return this.indexOf(item) >= 0;
};
Array.prototype.where = function <T>(this: T[], predicate: (item: T) => boolean) {
    return this.asEnumerable().where(predicate);
};
Array.prototype.orderBy = function <T>(this: T[], selector: (item: T) => any, direction: OrderDirection = OrderDirection.ASC) {
    return this.asEnumerable().orderBy(selector, direction);
};
Array.prototype.first = function <T>(this: T[], predicate?: (item: T) => boolean) {
    return predicate ? this.where(predicate).first() : this[0];
};
Array.prototype.last = function <T>(this: T[], predicate?: (item: T) => boolean) {
    return predicate ? this.where(predicate).last() : this[this.length - 1];
};
Array.prototype.any = function <T>(this: T[], predicate?: (item: T) => boolean) {
    return predicate ? this.asEnumerable().any(predicate) : this.length > 0;
};
Array.prototype.all = function <T>(this: T[], predicate: (item: T) => boolean) {
    return this.asEnumerable().all(predicate);
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
Array.prototype.innerJoin = function <T, T2, TKey, TResult>(this: T[], array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult) {
    return this.asEnumerable().innerJoin(array2, keySelector1, keySelector2, resultSelector);
};
Array.prototype.leftJoin = function <T, T2, TKey, TResult>(this: T[], array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2 | null) => TResult) {
    return this.asEnumerable().leftJoin(array2, keySelector1, keySelector2, resultSelector);
};
Array.prototype.rightJoin = function <T, T2, TKey, TResult>(this: T[], array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2) => TResult) {
    return this.asEnumerable().rightJoin(array2, keySelector1, keySelector2, resultSelector);
};
Array.prototype.fullJoin = function <T, T2, TKey, TResult>(this: T[], array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2 | null) => TResult) {
    return this.asEnumerable().fullJoin(array2, keySelector1, keySelector2, resultSelector);
};
Array.prototype.union = function <T>(this: T[], array2: T[], isUnionAll: boolean = false) {
    return this.asEnumerable().union(array2, isUnionAll);
};
Array.prototype.intersect = function <T>(this: T[], array2: T[]) {
    return this.asEnumerable().intersect(array2);
};
Array.prototype.except = function <T>(this: T[], array2: T[]) {
    return this.asEnumerable().except(array2);
};
Array.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }>(this: T[], dimensions: TD, metrics: TM): Enumerable<TResult> {
    return this.asEnumerable().pivot(dimensions, metrics);
};
