import { Enumerable } from "./Enumerable";

class SelectEnumerable<T = any, K = any> extends Enumerable<K> {
    constructor(items: T[] | Enumerable, fn: (item: T) => K) {
        super(items);
    }
    public [Symbol.iterator](): SelectEnumerable<T> {
        return this;
    }
    public next() {
        if (this.pointer < this.length) {
            return {
                done: this.pointer >= this.length,
                value: this[this.pointer]
            };
        }
        if (this.parent) {
            const result: IteratorResult<T> = {
                done: this.pointer >= this.parent.length,
                value: this.parent[this.pointer]
            };
            if (!result.done)
                this[this.pointer] = result.value;
            this.pointer++;
            return result;
        }

        return {
            value: this[selectorSymbol](value.value, this[indexSymbol]++),
            done: false
        };
    }
}
