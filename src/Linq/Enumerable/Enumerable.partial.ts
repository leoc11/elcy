import { OrderDirection } from "../../Common/Type";
import { DistinctEnumerable } from "./DistinctEnumerable";
import { Enumerable } from "./Enumerable";
import { ExceptEnumerable } from "./ExceptEnumerable";
import { FullJoinEnumerable } from "./FullJoinEnumerable";
import { GroupByEnumerable } from "./GroupByEnumerable";
import { GroupedEnumerable } from "./GroupedEnumerable";
import { defaultResultFn, InnerJoinEnumerable } from "./InnerJoinEnumerable";
import { IntersectEnumerable } from "./IntersectEnumerable";
import { LeftJoinEnumerable } from "./LeftJoinEnumerable";
import { OrderEnumerable } from "./OrderEnumerable";
import { RightJoinEnumerable } from "./RightJoinEnumerable";
import { SelectEnumerable } from "./SelectEnumerable";
import { SelectManyEnumerable } from "./SelectManyEnumerable";
import { SkipEnumerable } from "./SkipEnumerable";
import { TakeEnumerable } from "./TakeEnumerable";
import { UnionEnumerable } from "./UnionEnumerable";
import { WhereEnumerable } from "./WhereEnumerable";
declare module "./Enumerable" {
    interface Enumerable<T> {
        select<TReturn>(selector: (item: T) => TReturn): Enumerable<TReturn>;
        selectMany<TReturn>(selector: (item: T) => TReturn[] | Enumerable<TReturn>): Enumerable<TReturn>;
        where(predicate: (item: T) => boolean): Enumerable<T>;
        orderBy(selector: (item: T) => any, direction: OrderDirection): Enumerable<T>;
        skip(skip: number): Enumerable<T>;
        take(take: number): Enumerable<T>;
        groupBy<K>(keySelector: (item: T) => K): Enumerable<GroupedEnumerable<T, K>>;
        distinct(selector?: (item: T) => any): Enumerable<T>;
        innerJoin<T2, TKey, TResult>(array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        leftJoin<T2, TKey, TResult>(array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2 | null) => TResult): Enumerable<TResult>;
        rightJoin<T2, TKey, TResult>(array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2) => TResult): Enumerable<TResult>;
        fullJoin<T2, TKey, TResult>(array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2 | null) => TResult): Enumerable<TResult>;
        union(array2: T[] | Enumerable<T>, isUnionAll: boolean): Enumerable<T>;
        intersect(array2: T[] | Enumerable<T>): Enumerable<T>;
        except(array2: T[] | Enumerable<T>): Enumerable<T>;
        pivot<TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }>(dimensions: TD, metrics: TM): Enumerable<TResult>;
    }
}
Enumerable.prototype.select = function <T, TReturn>(this: Enumerable<T>, selector: (item: T) => TReturn): Enumerable<TReturn> {
    return new SelectEnumerable(this, selector);
};
Enumerable.prototype.selectMany = function <T, TReturn>(this: Enumerable<T>, selector: (item: T) => TReturn[] | Enumerable<TReturn>): Enumerable<TReturn> {
    return new SelectManyEnumerable(this, selector);
};
Enumerable.prototype.where = function <T>(this: Enumerable<T>, predicate: (item: T) => boolean): Enumerable<T> {
    return new WhereEnumerable(this, predicate);
};
Enumerable.prototype.orderBy = function <T>(this: Enumerable<T>, selector: (item: T) => any, direction: OrderDirection): Enumerable<T> {
    return new OrderEnumerable(this, selector, direction);
};
Enumerable.prototype.skip = function <T>(this: Enumerable<T>, skip: number): Enumerable<T> {
    return new SkipEnumerable(this, skip);
};
Enumerable.prototype.take = function <T>(this: Enumerable<T>, take: number): Enumerable<T> {
    return new TakeEnumerable(this, take);
};
Enumerable.prototype.groupBy = function <T, K>(this: Enumerable<T>, keySelector: (item: T) => K): Enumerable<GroupedEnumerable<T, K>> {
    return new GroupByEnumerable(this, keySelector);
};
Enumerable.prototype.distinct = function <T>(this: Enumerable<T>, selector?: (item: T) => any): Enumerable<T> {
    return new DistinctEnumerable(this, selector);
};
Enumerable.prototype.innerJoin = function <T, T2, TKey, TResult>(this: Enumerable<T>, array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
    return new InnerJoinEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, keySelector1, keySelector2, resultSelector);
};
Enumerable.prototype.leftJoin = function <T, T2, TKey, TResult>(this: Enumerable<T>, array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new LeftJoinEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, keySelector1, keySelector2, resultSelector);
};
Enumerable.prototype.rightJoin = function <T, T2, TKey, TResult>(this: Enumerable<T>, array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
    return new RightJoinEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, keySelector1, keySelector2, resultSelector);
};
Enumerable.prototype.fullJoin = function <T, T2, TKey, TResult>(this: Enumerable<T>, array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new FullJoinEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, keySelector1, keySelector2, resultSelector);
};
Enumerable.prototype.union = function <T>(this: Enumerable<T>, array2: T[] | Enumerable<T>, isUnionAll: boolean = false): Enumerable<T> {
    return new UnionEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, isUnionAll);
};
Enumerable.prototype.intersect = function <T>(this: Enumerable<T>, array2: T[] | Enumerable<T>): Enumerable<T> {
    return new IntersectEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2);
};
Enumerable.prototype.except = function <T>(this: Enumerable<T>, array2: T[] | Enumerable<T>): Enumerable<T> {
    return new ExceptEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2);
};
Enumerable.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }>(this: Enumerable<T>, dimensions: TD, metrics: TM): Enumerable<TResult> {
    return new SelectEnumerable(new GroupByEnumerable(this, (o) => {
        const dimensionKey: TResult = {} as any;
        for (const key in dimensions) {
            if (dimensions[key] instanceof Function)
                dimensionKey[key] = dimensions[key](o);
        }
        return dimensionKey;
    }), (o) => {
        for (const key in metrics) {
            if (o.key)
                o.key[key] = metrics[key](o.toArray());
        }
        return o.key;
    });
};
