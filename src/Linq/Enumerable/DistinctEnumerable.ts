import { Enumerable } from "./Enumerable";

export class DistinctEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector: (item: T) => any) {
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
        if (result.done && !this.isResultComplete) {
            // tslint:disable-next-line:no-conditional-assignment
            while (!(result = this.parent.next()).done) {
                const key = this.selector(result.value);
                if (!this.result.any((o) => this.keyComparer(key, this.selector(o))))
                    break;
            }
            if (result.done) {
                this.isResultComplete = true;
                return result;
            }
            this.result[this.pointer] = result.value;
            result.done = false;
        }
        if (!result.done)
            this.pointer++;
        return result;
    }
    private keyComparer = (a: T, b: T) => a instanceof Object ? JSON.stringify(a) === JSON.stringify(b) : a === b;
}
