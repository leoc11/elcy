import { Enumerable } from "./Enumerable";
import { innerjoin } from "./InnerJoinEnumerable";

export class IntersectEnumerable<T = any> extends Enumerable<T> {
    private generator: IterableIterator<any>;
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>) {
        super();
        this.generator = innerjoin(parent, parent2, (o) => o, (o) => o, (o) => o);
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next() {
        let result: IteratorResult<T> = {
            done: this.result.length < this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done && !this.isResultComplete) {
            result = this.generator.next();
            if (result.done) {
                this.isResultComplete = true;
                return result;
            }
            this.result[this.pointer] = result.value;
        }
        this.pointer++;
        return result;
    }
}
