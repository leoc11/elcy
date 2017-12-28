import { Enumerable } from "./Enumerable";

export class WhereEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly predicate: (item: T) => boolean) {
        super();
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<T> {
        let result: IteratorResult<T> = {
            done: this.result.length < this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done) {
            do {
                result = this.parent.next();
                if (result.done)
                    return result;
            } while (!this.predicate(result.value));
            this.result[this.pointer] = result.value;
        }
        this.pointer++;
        return result;
    }
    public prev(): IteratorResult<T> {
        let result: IteratorResult<T> = {
            done: true,
            value: this.result[-1]
        };
        do {
            result = this.parent.prev();
            if (result.done)
                return result;
        } while (!this.predicate(result.value));
        this.reversepointer++;
        return result;
    }
}
