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
import { IOrderDefinition } from "./Interface/IOrderDefinition";
import { IObjectType } from "../Common/Type";
declare module "./Enumerable" {
    interface Enumerable<T> {
        cast<TReturn>(): Enumerable<TReturn>;
        select<TReturn>(selector: (item: T) => TReturn, type?: IObjectType<TReturn>): Enumerable<TReturn>;
        selectMany<TReturn>(selector: (item: T) => Iterable<TReturn>): Enumerable<TReturn>;
        where(predicate: (item: T) => boolean): Enumerable<T>;
        orderBy(...selectors: IOrderDefinition<T>[]): Enumerable<T>;
        skip(skip: number): Enumerable<T>;
        take(take: number): Enumerable<T>;
        groupBy<K>(keySelector: (item: T) => K): Enumerable<GroupedEnumerable<T, K>>;
        distinct(selector?: (item: T) => any): Enumerable<T>;
        innerJoin<T2, TKey, TResult>(array2: Iterable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        leftJoin<T2, TKey, TResult>(array2: Iterable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2 | null) => TResult): Enumerable<TResult>;
        rightJoin<T2, TKey, TResult>(array2: Iterable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2) => TResult): Enumerable<TResult>;
        fullJoin<T2, TKey, TResult>(array2: Iterable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2 | null) => TResult): Enumerable<TResult>;
        union(array2: Iterable<T>, isUnionAll?: boolean): Enumerable<T>;
        intersect(array2: Iterable<T>): Enumerable<T>;
        except(array2: Iterable<T>): Enumerable<T>;
        pivot<TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends { [key in (keyof TD & keyof TM)]: any }>(dimensions: TD, metrics: TM): Enumerable<TResult>;
    }
}
Enumerable.prototype.cast = function <T, TReturn>(this: Enumerable<T>): Enumerable<TReturn> {
    return this as any;
};
Enumerable.prototype.select = function <T, TReturn>(this: Enumerable<T>, selector: (item: T) => TReturn, type?: IObjectType<TReturn>): Enumerable<TReturn> {
    return new SelectEnumerable(this, selector, type);
};
Enumerable.prototype.selectMany = function <T, TReturn>(this: Enumerable<T>, selector: (item: T) => TReturn[] | Enumerable<TReturn>): Enumerable<TReturn> {
    return new SelectManyEnumerable(this, selector);
};
Enumerable.prototype.where = function <T>(this: Enumerable<T>, predicate: (item: T) => boolean): Enumerable<T> {
    return new WhereEnumerable(this, predicate);
};
Enumerable.prototype.orderBy = function <T>(this: Enumerable<T>, ...selectors: IOrderDefinition<T>[]): Enumerable<T> {
    return new OrderEnumerable(this, ...selectors);
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
Enumerable.prototype.innerJoin = function <T, T2, TKey, TResult>(this: Enumerable<T>, array2: Iterable<T2> | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
    return new InnerJoinEnumerable(this, array2 instanceof Enumerable ? array2 : new Enumerable(array2), keySelector1, keySelector2, resultSelector);
};
Enumerable.prototype.leftJoin = function <T, T2, TKey, TResult>(this: Enumerable<T>, array2: Iterable<T2> | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new LeftJoinEnumerable(this, array2 instanceof Enumerable ? array2 : new Enumerable(array2), keySelector1, keySelector2, resultSelector);
};
Enumerable.prototype.rightJoin = function <T, T2, TKey, TResult>(this: Enumerable<T>, array2: Iterable<T2> | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
    return new RightJoinEnumerable(this, array2 instanceof Enumerable ? array2 : new Enumerable(array2), keySelector1, keySelector2, resultSelector);
};
Enumerable.prototype.fullJoin = function <T, T2, TKey, TResult>(this: Enumerable<T>, array2: Iterable<T2> | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new FullJoinEnumerable(this, array2 instanceof Enumerable ? array2 : new Enumerable(array2), keySelector1, keySelector2, resultSelector);
};
Enumerable.prototype.union = function <T>(this: Enumerable<T>, array2: Iterable<T> | Enumerable<T>, isUnionAll: boolean = false): Enumerable<T> {
    return new UnionEnumerable(this, array2 instanceof Enumerable ? array2 : new Enumerable(array2), isUnionAll);
};
Enumerable.prototype.intersect = function <T>(this: Enumerable<T>, array2: Iterable<T> | Enumerable<T>): Enumerable<T> {
    return new IntersectEnumerable(this, array2 instanceof Enumerable ? array2 : new Enumerable(array2));
};
Enumerable.prototype.except = function <T>(this: Enumerable<T>, array2: Iterable<T> | Enumerable<T>): Enumerable<T> {
    return new ExceptEnumerable(this, array2 instanceof Enumerable ? array2 : new Enumerable(array2));
};
Enumerable.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends { [key in (keyof TD & keyof TM)]: any }>(this: Enumerable<T>, dimensions: TD, metrics: TM): Enumerable<TResult> {
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
