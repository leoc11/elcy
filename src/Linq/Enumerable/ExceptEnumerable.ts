import { Enumerable, keyComparer } from "./Enumerable";

export function* except<T>(enumerable1: Enumerable<T>, enumerable2: Enumerable<T>) {
    enumerable1.resetPointer();
    let result1 = enumerable1.next();
    while (!result1.done) {
        const comparer = (o: T) => keyComparer(o, result1.value);
        if (!enumerable2.any(comparer))
            yield result1.value;
        result1 = enumerable1.next();
    }
}
export class ExceptEnumerable<T = any> extends Enumerable<T> {
    private generator: IterableIterator<any>;
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>) {
        super();
        this.generator = except(parent, parent2);
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next() {
        let result: IteratorResult<T> = {
            done: this.result.length <= this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done && !this.isResultComplete) {
            result = this.generator.next();
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
