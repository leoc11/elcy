import { Enumerable, keyComparer } from "./Enumerable";

export class DistinctEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector?: (item: T) => any) {
        super();
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<T> {
        let result: IteratorResult<T> = {
            done: this.result.length <= this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done && !this.isResultComplete) {
            // tslint:disable-next-line:no-conditional-assignment
            while (!(result = this.parent.next()).done) {
                const key = this.selector ? this.selector(result.value) : result.value;
                if (!this.result.any((o) => keyComparer(key, this.selector ? this.selector(result.value) : result.value)))
                    break;
            }
            if (result.done) {
                this.isResultComplete = true;
                this.resetPointer();
                return result;
            }
            this.result[this.pointer] = result.value;
            result.done = false;
        }
        result.done ? this.resetPointer() : this.pointer++;
        return result;
    }
}
