import { Enumerable } from "./Enumerable";

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
    }
}
