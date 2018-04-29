export const keyComparer = <T = any>(a: T, b: T) => {
    let result = a === b;
    if (!result && a instanceof Object) {
        try {
            const aKeys = Object.keys(a);
            const bKeys = Object.keys(b);
            result = aKeys.length === bKeys.length;
            if (result) {
                result = aKeys.all(o => b.hasOwnProperty(o) && (b as any)[o] === (a as any)[o]);
            }
        }
        catch (e) {

        }
    }
    return result;
};
export class Enumerable<T = any> {
    protected pointer = 0;
    protected isResultComplete = false;
    protected result: T[] = [];
    protected parent: Enumerable;
    protected iterators: Iterator<T>;
    constructor(source?: T[] | Iterator<T>) {
        if (source) {
            if (Array.isArray(source)) {
                this.result = source;
                this.isResultComplete = true;
            }
            else {
                this.iterators = source;
            }
        }
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<T> {
        let rest: IteratorResult<T>;
        if (this.isResultComplete) {
            rest = {
                done: !this.result || this.result.length <= this.pointer,
                value: this.result ? this.result[this.pointer++] : undefined as any
            };
        }
        else {
            rest = this.next();
            if (rest.done)
                this.isResultComplete = true;
            else
                this.result.push(rest.value);
        }
        if (rest.done)
            this.resetPointer();
        return rest;
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
    public toArray(): T[] {
        const arr = [];
        this.resetPointer();
        for (const i of this) {
            arr.push(i);
        }
        return arr;
    }
    public all(predicate?: (item: T) => boolean): boolean {
        this.resetPointer();
        for (const item of this) {
            if (predicate && !predicate(item)) {
                return false;
            }
        }
        return true;
    }
    public any(predicate?: (item: T) => boolean): boolean {
        this.resetPointer();
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return true;
            }
        }
        return false;
    }
    public first(predicate?: (item: T) => boolean): T | null {
        this.resetPointer();
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return item;
            }
        }
        return null;
    }
    public count(predicate?: (item: T) => boolean): number {
        let count = 0;
        this.resetPointer();
        for (const item of this) {
            if (!predicate || predicate(item))
                count++;
        }
        return count;
    }
    public sum(selector?: (item: T) => number): number {
        let sum = 0;
        this.resetPointer();
        for (const item of this)
            sum += selector ? selector(item) : item as any;
        return sum;
    }
    public avg(selector?: (item: T) => number): number {
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
        let max = -Infinity;
        for (const item of this) {
            const num = selector ? selector(item) : item as any;
            if (max < num)
                max = num;
        }
        return max;
    }
    public min(selector?: (item: T) => number): number {
        this.resetPointer();
        let min = Infinity;
        for (const item of this) {
            const num = selector ? selector(item) : item as any;
            if (!min || min > num)
                min = num;
        }
        return min;
    }
    public contains(item: T): boolean {
        this.resetPointer();
        for (const it of this) {
            if (it === item)
                return true;
        }
        return false;
    }
}
