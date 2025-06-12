import { IObjectType, Pivot, ValueType } from "../Common/Type";
import { Enumerable } from "./Enumerable.internal";
import { CrossJoinEnumerable } from "./CrossJoinEnumerable";
import { DistinctEnumerable } from "./DistinctEnumerable";
import { ExceptEnumerable } from "./ExceptEnumerable";
import { FullJoinEnumerable } from "./FullJoinEnumerable";
import { GroupByEnumerable } from "./GroupByEnumerable";
import { GroupJoinEnumerable } from "./GroupJoinEnumerable";
import { IEnumerable } from "./IEnumerable";
import { InnerJoinEnumerable } from "./InnerJoinEnumerable";
import { IOrderDefinition } from "./Interface/IOrderDefinition";
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
import { isNotNull } from "../Helper/Util";
declare module "./Enumerable" {
    interface Enumerable<T> {
        cast<TReturn>(): Enumerable<TReturn>;
        crossJoin<T2, TResult>(array2: IEnumerable<T2>, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        distinct(selector?: (item: T) => unknown): Enumerable<T>;
        except(array2: IEnumerable<T>): Enumerable<T>;
        fullJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2 | null) => TResult): Enumerable<TResult>;
        groupBy<K>(keySelector: (item: T) => K): GroupByEnumerable<K, T>;
        groupJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2[]) => TResult): Enumerable<TResult>;
        innerJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2) => TResult): Enumerable<TResult>;
        intersect(array2: IEnumerable<T>): Enumerable<T>;
        leftJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2 | null) => TResult): Enumerable<TResult>;
        orderBy(...selectors: Array<IOrderDefinition<T>>): Enumerable<T>;
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(dimensions: TD, metrics: TM): Enumerable<Pivot<T, TD, TM>>;
        rightJoin<T2, TResult>(array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2) => TResult): Enumerable<TResult>;
        select<TReturn>(type: IObjectType<TReturn>, selector: ((item: T) => TReturn)): Enumerable<TReturn>;
        select<TReturn>(selector: ((item: T) => TReturn)): Enumerable<TReturn>;
        select<TReturn>(typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)): Enumerable<TReturn>;
        selectMany<TReturn>(selector: (item: T) => Iterable<TReturn>): Enumerable<TReturn>;
        skip(skip: number): Enumerable<T>;
        take(take: number): Enumerable<T>;
        union(array2: IEnumerable<T>, isUnionAll?: boolean): Enumerable<T>;
        where(predicate: (item: T) => boolean): Enumerable<T>;
    }
}
Enumerable.prototype.cast = function <T, TReturn>(this: Enumerable<T>): Enumerable<TReturn> {
    return this as unknown as Enumerable<TReturn>;
};
Enumerable.prototype.select = function <T, TReturn>(this: Enumerable<T>, typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: (item: T) => TReturn): Enumerable<TReturn> {
    let type: IObjectType<TReturn>;
    if (!selector) {
        selector = typeOrSelector as (item: T) => TReturn;
    }
    else {
        type = typeOrSelector as IObjectType<TReturn>;
    }
    return new SelectEnumerable(this, selector, type);
};
Enumerable.prototype.selectMany = function <T, TReturn>(this: Enumerable<T>, selector: (item: T) => TReturn[] | Enumerable<TReturn>): Enumerable<TReturn> {
    return new SelectManyEnumerable(this, selector);
};
Enumerable.prototype.where = function <T>(this: Enumerable<T>, predicate: (item: T) => boolean): Enumerable<T> {
    return new WhereEnumerable(this, predicate);
};
Enumerable.prototype.orderBy = function <T>(this: Enumerable<T>, ...selectors: Array<IOrderDefinition<T>>): Enumerable<T> {
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
Enumerable.prototype.distinct = function <T>(this: Enumerable<T>, selector?: (item: T) => unknown): Enumerable<T> {
    return new DistinctEnumerable(this, selector);
};
Enumerable.prototype.innerJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
    return new InnerJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.leftJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new LeftJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.rightJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
    return new RightJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.fullJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T | null, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new FullJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.groupJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: IEnumerable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector: (item1: T, item2: T2[]) => TResult = defaultResultFn): Enumerable<TResult> {
    return new GroupJoinEnumerable(this, Enumerable.from(array2), relation, resultSelector);
};
Enumerable.prototype.crossJoin = function <T, T2, TResult>(this: Enumerable<T>, array2: IEnumerable<T2>, resultSelector: (item1: T | null, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
    return new CrossJoinEnumerable(this, Enumerable.from(array2), resultSelector);
};
Enumerable.prototype.union = function <T>(this: Enumerable<T>, array2: IEnumerable<T>, isUnionAll: boolean = false): Enumerable<T> {
    return new UnionEnumerable(this, Enumerable.from(array2), isUnionAll);
};
Enumerable.prototype.intersect = function <T>(this: Enumerable<T>, array2: IEnumerable<T>): Enumerable<T> {
    return new IntersectEnumerable(this, Enumerable.from(array2));
};
Enumerable.prototype.except = function <T>(this: Enumerable<T>, array2: IEnumerable<T>): Enumerable<T> {
    return new ExceptEnumerable(this, Enumerable.from(array2));
};
Enumerable.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(this: Enumerable<T>, dimensions: TD, metrics: TM): Enumerable<Pivot<T, TD, TM>> {
    return this.groupBy((o) => {
        const dimensionKey = {} as Pivot<T, TD, TM>;
        for (const key in dimensions) {
            if (dimensions[key] instanceof Function) {
                dimensionKey[key] = dimensions[key](o) as Pivot<T, TD, TM>[Extract<keyof TD, string>];
            }
        }
        return dimensionKey;
    }).select((o) => {
        for (const key in metrics) {
            if (o.key) {
                o.key[key] = metrics[key](o.toArray()) as Pivot<T, TD, TM>[Extract<keyof TM, string>];
            }
        }
        return o.key;
    });
};

export const keyComparer = <T = unknown>(a: T, b: T) => {
    let result = a === b;
    if (!result && isNotNull(a) && isNotNull(b) && a instanceof Object && b instanceof Object) {
        const aKeys = Object.keys(a) as Array<keyof T>;
        const bKeys = Object.keys(b) as Array<keyof T>;
        result = aKeys.length === bKeys.length;
        if (result) {
            result = aKeys.all((o) => Object.prototype.hasOwnProperty.call(b, o) && b[o] === a[o]);
        }
    }
    return result;
};
export const defaultResultFn = <T = unknown, T2 = unknown, R = unknown>(item1: T | null, item2: T2 | null): R => {
    const result = {} as Partial<Record<string, unknown>>;
    if (item2) {
        for (const prop in item2) {
            result[prop] = item2[prop];
        }
    }
    if (item1) {
        for (const prop in item1) {
            result[prop] = item1[prop];
        }
    }
    return result as R;
};

export { Enumerable };