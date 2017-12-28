
const fnTrue = () => true;
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
            value: this.result[this.reversepointer--]
        };
    }
    public resetPointer() {
        this.pointer = 0;
    }
    public reset(cleanReset = false) {
        this.result = [];
        this.resetPointer();
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
    public all(predicate: (item: T) => boolean = fnTrue) {
        for (const item of this) {
            if (!predicate(item)) {
                return false;
            }
        }
        return true;
    }
    public any(predicate: (item: T) => boolean = fnTrue) {
        for (const item of this) {
            if (predicate(item)) {
                return true;
            }
        }
        return false;
    }

    public first(predicate: (item: T) => boolean = fnTrue) {
        for (const item of this) {
            if (predicate(item)) {
                return item;
            }
        }
        return undefined;
    }
    public last(predicate: (item: T) => boolean = fnTrue) {
        for (const item of this.reverse()) {
            if (predicate(item)) {
                return item;
            }
        }
        return undefined;
    }
}
