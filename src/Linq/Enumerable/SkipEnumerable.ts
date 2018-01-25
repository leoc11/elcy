import { Enumerable } from "./Enumerable";

export class SkipEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly skipCount: number) {
        super();
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<T> {
        if (this.pointer <= 0) {
            for (let i = 0; i < this.skipCount && !(this.parent.next().done); i++);
        }
        let result: IteratorResult<T> = {
            done: this.result.length <= this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done && !this.isResultComplete) {
            result = this.next();
            if (result.done) {
                this.isResultComplete = true;
                this.resetPointer();
                return result;
            }
            this.result[this.pointer] = result.value;
        }
        this.pointer++;
        return result;
    }
}
