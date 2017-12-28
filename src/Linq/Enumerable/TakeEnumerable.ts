import { Enumerable } from "./Enumerable";

export class TakeEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly take: number) {
        super();
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<T> {
        if (this.pointer >= this.take) {
            return {
                done: true,
                value: this.result[this.pointer]
            };
        }
        let result: IteratorResult<T> = {
            done: this.result.length < this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done) {
            result = this.next();
            if (result.done)
                return result;
            this.result[this.pointer] = result.value;
        }
        this.pointer++;
        return result;
    }
}
