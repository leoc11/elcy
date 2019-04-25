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
import { IObjectType, ValueType } from "../Common/Type";
import { GroupJoinEnumerable } from "./GroupJoinEnumerable";
declare module "./Enumerable" {
    interface Enumerable<T> {
        cast<TReturn>(): Enumerable<TReturn>;
        select<TReturn>(type: IObjectType<TReturn>, selector: ((item: T) => TReturn)): Enumerable<TReturn>;
        select<TReturn>(selector: ((item: T) => TReturn)): Enumerable<TReturn>;
        select<TReturn>(typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)): Enumerable<TReturn>;
        selectMany<TReturn>(selector: (item: T) => Iterable<TReturn>): Enumerable<TReturn>;
        where(predicate: (item: T) => boolean): Enumerable<T>;
        orderBy(...selectors: IOrderDefinition<T>[]): Enumerable<T>;
        skip(skip: number): Enumerable<T>;
        take(take: number): Enumerable<T>;
        groupBy<K>(keySelector: (item: T) => K): Enumerable<GroupedEnumerable<K, T>>;
        distinct(selector?: (item: T) => any): Enumerable<T>;
        innerJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        leftJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2 | null) => TResult): Enumerable<TResult>;
        rightJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2) => TResult): Enumerable<TResult>;
        fullJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2 | null) => TResult): Enumerable<TResult>;
        groupJoin<T2, TResult>(array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2[]) => TResult): Enumerable<TResult>;
        union(array2: Iterable<T>, isUnionAll?: boolean): Enumerable<T>;
        intersect(array2: Iterable<T>): Enumerable<T>;
        except(array2: Iterable<T>): Enumerable<T>;
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }, TResult extends { [key in (keyof TD & keyof TM)]: ValueType }>(dimensions: TD, metrics: TM): Enumerable<TResult>;
    }
}
Enumerable.prototype.cast = function <T, TReturn>(this: Enumerable<T>): Enumerable<TReturn> {
    return this as any;
};
Enumerable.prototype.select = function <T, TReturn>(this: Enumerable<T>, typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)): Enumerable<TReturn> {
    let type: IObjectType<TReturn>;
    if (!selector) {
        selector = typeOrSelector as any;
    }
    else {
        type = typeOrSelector as any;
    }
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
Enumerable.prototype.groupBy = function <T, K>(this: Enumerable<T>, keySelector: (item: T) => K): GroupByEnumerable<K, T> {
    return new GroupByEnumerable(this, keySelector);
};
Enumerable.prototype.distinct = function <T>(this: Enumerable<T>, selector?: (item: T) => any): Enumerable<T> {
    return new DistinctEnumerable(this, selector);
};
Enumerable.prototype.innerJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
    return new InnerJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.leftJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new LeftJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.rightJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
    return new RightJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.fullJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new FullJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.groupJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: Iterable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2[]) => TResult = defaultResultFn): Enumerable<TResult> {
    return new GroupJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.union = function <T>(this: Enumerable<T>, array2: Iterable<T>, isUnionAll: boolean = false): Enumerable<T> {
    return new UnionEnumerable(this, Enumerable.from(array2), isUnionAll);
};
Enumerable.prototype.intersect = function <T>(this: Enumerable<T>, array2: Iterable<T>): Enumerable<T> {
    return new IntersectEnumerable(this, Enumerable.from(array2));
};
Enumerable.prototype.except = function <T>(this: Enumerable<T>, array2: Iterable<T>): Enumerable<T> {
    return new ExceptEnumerable(this, Enumerable.from(array2));
};
Enumerable.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }, TResult extends { [key in (keyof TD & keyof TM)]: ValueType }>(this: Enumerable<T>, dimensions: TD, metrics: TM): Enumerable<TResult> {
    return new SelectEnumerable(new GroupByEnumerable(this, (o) => {
        const dimensionKey: TResult = {} as any;
        for (const key in dimensions) {
            if (dimensions[key] instanceof Function)
                dimensionKey[key] = dimensions[key](o) as TResult[keyof TD];
        }
        return dimensionKey;
    }), (o) => {
        for (const key in metrics) {
            if (o.key)
                o.key[key] = metrics[key](o.toArray()) as TResult[keyof TM];
        }
        return o.key;
    });
};
