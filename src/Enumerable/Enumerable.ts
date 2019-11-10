import { GenericType } from "../Common/Type";
import { isNull } from "../Helper/Util";
import { IEnumerableCache } from "./IEnumerableCache";

export const keyComparer = <T = any>(a: T, b: T) => {
    let result = a === b;
    if (!result && !isNull(a) && !isNull(b) && a instanceof Object && b instanceof Object) {
        const aKeys = Object.keys(a) as Array<keyof T>;
        const bKeys = Object.keys(b) as Array<keyof T>;
        result = aKeys.length === bKeys.length;
        if (result) {
            result = aKeys.all((o) => b.hasOwnProperty(o) && b[o] === a[o]);
        }
    }
    return result;
};
export class Enumerable<T = any> implements Iterable<T> {
    public set enableCache(value) {
        if (this.parent) {
            this.cache.enabled = value;
            if (!value) {
                this.cache.result = null;
            }
        }
    }
    public get enableCache() {
        return !this.parent || this.cache.enabled;
    }
    constructor(source?: Iterable<any> | (() => Generator<T> | IterableIterator<T>)) {
        this.cache = {};
        if (source) {
            if (Array.isArray(source)) {
                this.cache.result = source;
                this.cache.enabled = true;
                this.cache.isDone = true;
            }
            else {
                let iterable: Iterable<any> = null;
                if (source[Symbol.iterator]) {
                    iterable = source as Iterable<any>;
                }
                else {
                    iterable = {
                        [Symbol.iterator]() {
                            return (source as Function)();
                        }
                    };
                }

                this.parent = iterable;
            }
        }
    }
    public static from<T>(source: Iterable<T> | (() => Generator<T> | IterableIterator<T>)): Enumerable<T> {
        return source instanceof Enumerable ? source : new Enumerable(source);
    }
    public static range(start: number, end: number, step: number = 1) {
        return new Enumerable(function* () {
            while (start <= end) {
                yield start;
                start += step;
            }
        });
    }
    protected cache: IEnumerableCache<T>;
    protected parent: Iterable<any>;
    public [Symbol.iterator](): IterableIterator<T> {
        if (this.enableCache) {
            return this.cachedGenerator();
        }
        return this.generator();
    }
    public all(predicate: (item: T) => boolean): boolean {
        for (const item of this) {
            if (!predicate(item)) {
                return false;
            }
        }
        return true;
    }
    public any(predicate?: (item: T) => boolean): boolean {
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return true;
            }
        }
        return false;
    }
    public avg(selector?: (item: T) => number): number {
        let sum = 0;
        let count = 0;
        for (const item of this) {
            sum += selector ? selector(item) : item as any;
            count++;
        }
        return sum / count;
    }
    public contains(item: T): boolean {
        for (const it of this) {
            if (it === item) {
                return true;
            }
        }
        return false;
    }
    public count(predicate?: (item: T) => boolean): number {
        let count = 0;
        for (const item of this) {
            if (!predicate || predicate(item)) {
                count++;
            }
        }
        return count;
    }

    // Helper extension
    public each(executor: (item: T, index: number) => void): void {
        let index = 0;
        for (const item of this) {
            executor(item, index++);
        }
    }
    public first(predicate?: (item: T) => boolean): T | null {
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return item;
            }
        }
        return null;
    }
    public max(selector?: (item: T) => number): number {
        let max = -Infinity;
        for (const item of this) {
            const num = selector ? selector(item) : item as any;
            if (max < num) {
                max = num;
            }
        }
        return max;
    }
    public min(selector?: (item: T) => number): number {
        let min = Infinity;
        for (const item of this) {
            const num = selector ? selector(item) : item as any;
            if (!min || min > num) {
                min = num;
            }
        }
        return min;
    }
    public ofType<TType>(type: GenericType<TType>): Enumerable<TType> {
        return this.where((o) => o instanceof (type as any)) as any;
    }
    public reduce<R>(func: (accumulated: R, item: T) => R): R;
    public reduce<R>(seed: R, func: (accumulated: R, item: T) => R): R;
    public reduce<R>(seedOrFunc: R | ((accumulated: R, item: T) => R), func?: (accumulated: R, item: T) => R): R {
        let accumulated: R;
        if (func) {
            accumulated = seedOrFunc as any;
        }
        else {
            func = seedOrFunc as any;
        }

        for (const a of this) {
            accumulated = func(accumulated, a);
        }
        return accumulated;
    }
    public sum(selector?: (item: T) => number): number {
        let sum = 0;
        for (const item of this) {
            sum += selector ? selector(item) : item as any;
        }
        return sum;
    }
    public toArray(): T[] {
        if (this.enableCache && this.cache.isDone) {
            return this.cache.result.slice(0);
        }

        const arr = [];
        for (const i of this) {
            arr.push(i);
        }
        return arr;
    }
    public toMap<K, V = T>(keySelector: (item: T) => K, valueSelector?: (item: T) => V): Map<K, V> {
        const rel = new Map<K, V>();
        for (const i of this) {
            rel.set(keySelector(i), valueSelector ? valueSelector(i) : i as any);
        }
        return rel;
    }
    protected *generator() {
        for (const value of this.parent) {
            yield value;
        }
    }
    private *cachedGenerator(): IterableIterator<T> {
        if (this.cache.isDone) {
            yield* this.cache.result;
            return;
        }

        if (!this.cache.iterator) {
            this.cache.iterator = this.generator();
            this.cache.result = [];
        }
        else if (!this.cache.result) {
            this.cache.result = [];
        }
        const iterator = this.cache.iterator as (IterableIterator<any> & { _accessCount: number });
        if (iterator && !iterator._accessCount) {
            iterator._accessCount = 0;
        }
        iterator._accessCount++;

        try {
            let index = 0;
            for (; ;) {
                const isDone = this.cache.isDone;
                const len = this.cache.result.length;
                while (len > index) {
                    yield this.cache.result[index++];
                }
                if (isDone) {
                    break;
                }

                const a = iterator.next();
                if (!a.done) {
                    this.cache.result.push(a.value);
                }
                else if (!this.cache.isDone) {
                    this.cache.isDone = true;
                }
            }
        }
        finally {
            iterator._accessCount--;
            if (iterator.return && iterator._accessCount <= 0) {
                iterator.return();
                if (this.cache.iterator === iterator) {
                    this.cache.iterator = null;
                }
            }
        }
    }
}

import "./Enumerable.partial";
