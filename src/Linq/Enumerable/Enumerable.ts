import { SelectEnumerable } from "./SelectEnumerable";
import { SelectManyEnumerable } from "./SelectManyEnumerable";
import { WhereEnumerable } from "./WhereEnumerable";
import { OrderEnumerable } from "./OrderEnumerable";
import { orderDirection } from "../../Common/Type";

export class Enumerable<T = any> implements IterableIterator<T> {
    protected pointer = 0;
    protected reversepointer = 0;
    protected result: T[] = [];
    protected parent: Enumerable;
    constructor(result: T[] = []) {
        this.result = result;
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
    public prev(): IteratorResult<T> {
        return {
            done: this.reversepointer < 0,
            value: this.result[this.result.length - (this.reversepointer + 1)]
        };
    }
    public resetPointer(cleanReset = false) {
        this.pointer = 0;
        if (cleanReset && this.parent)
            this.parent.resetPointer(cleanReset);
    }
    public resetReversePointer(cleanReset = false) {
        this.reversepointer = 0;
        if (cleanReset && this.parent)
            this.parent.resetReversePointer(cleanReset);
    }
    public reset(cleanReset = false) {
        this.result = [];
        this.resetPointer();
        this.resetReversePointer();
        if (cleanReset && this.parent)
            this.parent.reset(cleanReset);
    }

    public toArray() {
        const arr = [];
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
    public first(predicate?: (item: T) => boolean) {
        this.resetPointer();
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return item;
            }
        }
        return undefined;
    }
    public last(predicate?: (item: T) => boolean) {
        this.resetReversePointer();
        let prev = this.prev();
        while (!prev.done && (predicate && !predicate(prev.value))) {
            prev = this.prev();
        }
        return prev.value;
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
    public max(selector?: (item: T) => number) {
        this.resetPointer();
        let max: number | undefined;
        for (const item of this) {
            const num = selector ? selector(item) : item as any;
            if (!max || max < num)
                max = num;
        }
        return max;
    }
    public min(selector?: (item: T) => number) {
        this.resetPointer();
        let min: number | undefined;
        for (const item of this) {
            const num = selector ? selector(item) : item as any;
            if (!min || min > num)
                min = num;
        }
        return min;
    }
    public contains(item: T) {
        this.resetPointer();
        for (const it of this) {
            if (it === item)
                return true;
        }
        return false;
    }
    public select<TReturn>(selector: (item: T) => TReturn): SelectEnumerable<T, TReturn> {
        return new SelectEnumerable(this, selector);
    }
    public selectMany<TReturn>(selector: (item: T) => TReturn[]): SelectManyEnumerable<T, TReturn> {
        return new SelectManyEnumerable(this, selector);
    }
    public where(predicate: (item: T) => boolean): WhereEnumerable<T> {
        return new WhereEnumerable(this, predicate);
    }
    public orderBy(selector: (item: T) => any, direction: orderDirection): OrderEnumerable<T> {
        return new OrderEnumerable(this, selector, direction);
    }
}
