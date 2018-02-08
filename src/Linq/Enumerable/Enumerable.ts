export const keyComparer = <T>(a: T, b: T) => {
    let result = a === b;
    if (!result && a instanceof Object) {
        try {
            result = JSON.stringify(a) === JSON.stringify(b);
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
    constructor(result?: T[]) {
        // super();
        if (result) {
            this.result = result;
            this.isResultComplete = true;
        }
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<T> {
        const rest: IteratorResult<T> = {
            done: !this.result || this.result.length <= this.pointer,
            value: this.result ? this.result[this.pointer++] : undefined as any
        };
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
    // public last(predicate?: (item: T) => boolean) {
    //     const array = predicate ? (this as any).where(predicate).toArray() : this.toArray();
    //     return array[array.length - 1];
    // }
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
    public include(...includes: Array<(item: T) => any>): Enumerable<T> {
        return this;
    }
}
