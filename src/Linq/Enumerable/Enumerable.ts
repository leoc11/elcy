import { orderDirection } from "../../Common/Type";
import { DistinctEnumerable } from "./DistinctEnumerable";
import { ExceptEnumerable } from "./ExceptEnumerable";
import { FullJoinEnumerable } from "./FullJoinEnumerable";
import { GroupByEnumerable } from "./GroupByEnumerable";
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

export const keyComparer = <T>(a: T, b: T) => a instanceof Object ? JSON.stringify(a) === JSON.stringify(b) : a === b;
export class Enumerable<T = any> extends Array<T> {
    protected pointer = 0;
    protected isResultComplete = false;
    protected result: T[] = [];
    protected parent: Enumerable;
    constructor(result: T[] = []) {
        super();
        this.result = result;
        this.isResultComplete = true;
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<T> {
        return {
            done: this.result.length < this.pointer,
            value: this.result[this.pointer++]
        };
    }
    public resetPointer(cleanReset = false) {
        this.pointer = 0;
        if (cleanReset && this.parent)
            this.parent.resetPointer(cleanReset);
    }
    public reset(cleanReset = false) {
        this.result = [];
        this.resetPointer();
        if (cleanReset && this.parent)
            this.parent.reset(cleanReset);
    }
    public toArray() {
        const arr = [];
        this.resetPointer();
        for (const i of this) {
            arr.push(i);
        }
        return arr;
    }
    public all(predicate?: (item: T) => boolean) {
        this.resetPointer();
        for (const item of this) {
            if (predicate && !predicate(item)) {
                return false;
            }
        }
        return true;
    }
    public any(predicate?: (item: T) => boolean) {
        this.resetPointer();
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return true;
            }
        }
        return false;
    }
    public first(predicate?: (item: T) => boolean): T {
        this.resetPointer();
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return item;
            }
        }
        return undefined as any;
    }
    public last(predicate?: (item: T) => boolean) {
        const array = predicate ? this.where(predicate).toArray() : this.toArray();
        return array[array.length - 1];
    }
    public count(predicate?: (item: T) => boolean) {
        let count = 0;
        this.resetPointer();
        for (const item of this) {
            if (!predicate || predicate(item))
                count++;
        }
        return count;
    }
    public sum(selector?: (item: T) => number) {
        let sum = 0;
        this.resetPointer();
        for (const item of this)
            sum += selector ? selector(item) : item as any;
        return sum;
    }
    public avg(selector?: (item: T) => number) {
        let sum = 0;
        let count = 0;
        this.resetPointer();
        for (const item of this) {
            sum += selector ? selector(item) : item as any;
            count++;
        }
        return sum / count;
    }
    public max(selector?: (item: T) => number): number {
        this.resetPointer();
        let max: number | undefined;
        for (const item of this) {
            const num = selector ? selector(item) : item as any;
            if (!max || max < num)
                max = num;
        }
        return -Infinity;
    }
    public min(selector?: (item: T) => number): number {
        this.resetPointer();
        let min: number | undefined;
        for (const item of this) {
            const num = selector ? selector(item) : item as any;
            if (!min || min > num)
                min = num;
        }
        return Infinity;
    }
    public contains(item: T) {
        this.resetPointer();
        for (const it of this) {
            if (it === item)
                return true;
        }
        return false;
    }
    public select<TReturn>(selector: (item: T) => TReturn): Enumerable<TReturn> {
        return new SelectEnumerable(this, selector);
    }
    public selectMany<TReturn>(selector: (item: T) => TReturn[]): Enumerable<TReturn> {
        return new SelectManyEnumerable(this, selector);
    }
    public where(predicate: (item: T) => boolean): Enumerable<T> {
        return new WhereEnumerable(this, predicate);
    }
    public orderBy(selector: (item: T) => any, direction: orderDirection): Enumerable<T> {
        return new OrderEnumerable(this, selector, direction);
    }
    public skip(skip: number): Enumerable<T> {
        return new SkipEnumerable(this, skip);
    }
    public take(take: number): Enumerable<T> {
        return new TakeEnumerable(this, take);
    }
    public groupBy<K>(keySelector: (item: T) => K): GroupByEnumerable<T, K> {
        return new GroupByEnumerable(this, keySelector);
    }
    public distinct(selector: (item: T) => any = (o) => o): Enumerable<T> {
        return new DistinctEnumerable(this, selector);
    }
    public innerJoin<T2, TKey, TResult>(array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
        return new InnerJoinEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, keySelector1, keySelector2, resultSelector);
    }
    public leftJoin<T2, TKey, TResult>(array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
        return new LeftJoinEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, keySelector1, keySelector2, resultSelector);
    }
    public rightJoin<T2, TKey, TResult>(array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2) => TResult = defaultResultFn): Enumerable<TResult> {
        return new RightJoinEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, keySelector1, keySelector2, resultSelector);
    }
    public fullJoin<T2, TKey, TResult>(array2: T2[] | Enumerable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | null, item2: T2 | null) => TResult = defaultResultFn): Enumerable<TResult> {
        return new FullJoinEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, keySelector1, keySelector2, resultSelector);
    }
    public union(array2: T[] | Enumerable<T>, isUnionAll: boolean = false): Enumerable<T> {
        return new UnionEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2, isUnionAll);
    }
    public intersect(array2: T[] | Enumerable<T>): Enumerable<T> {
        return new IntersectEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2);
    }
    public except(array2: T[] | Enumerable<T>): Enumerable<T> {
        return new ExceptEnumerable(this, Array.isArray(array2) ? new Enumerable(array2) : array2);
    }
    public pivot<TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }>(dimensions: TD, metrics: TM): Enumerable<TResult> {
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
    }
    public include(..._includes: Array<(item: T) => any>): Enumerable<T> {
        return this;
    }
}
