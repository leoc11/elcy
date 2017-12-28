import { Enumerable } from "./Enumerable";

<<<<<<< HEAD
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
=======
export class SelectEnumerable<T = any, K = any> extends Enumerable<K> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector: (item: T) => K) {
        super();
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<K> {
        const result: IteratorResult<K> = {
            done: this.result.length < this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done) {
            const presult = this.parent.next();
            if (presult.done)
                return presult as IteratorResult<any>;
            result.value = this.result[this.pointer] = this.selector(presult.value);
        }
        this.pointer++;
        return result;
    }
    public prev(): IteratorResult<K> {
        const result: IteratorResult<K> = {
            done: this.reversepointer < 0,
            value: this.result[this.reversepointer]
        };
        if (result.done) {
            const presult = this.parent.prev();
            if (presult.done)
                return presult as IteratorResult<any>;
            result.value = this.result[this.reversepointer] = this.selector(presult.value);
        }
        this.pointer--;
        return result;
>>>>>>> aa29ff2b903d23c21bb5c68a3905b9b4e545884f
    }
}
