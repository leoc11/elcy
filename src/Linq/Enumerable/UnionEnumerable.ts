import { Enumerable, keyComparer } from "./Enumerable";

export function* union<T>(enumerable1: Enumerable<T>, enumerable2: Enumerable<T>) {
    enumerable1.resetPointer();
    let result1 = enumerable1.next();
    while (!result1.done) {
        yield result1.value;
    }
    enumerable2.resetPointer();
    result1 = enumerable2.next();
    while (!result1.done) {
        yield result1.value;
    }
}
export class UnionEnumerable<T = any> extends Enumerable<T> {
    private generator: IterableIterator<any>;
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>, public readonly isUnionAll = false) {
        super();
        this.generator = union(parent, parent2);
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
            do {
                result = this.generator.next();
                if (result.done) {
                    this.isResultComplete = true;
                    this.resetPointer();
                    return result;
                }
            } while (!this.isUnionAll && this.result.any((o) => keyComparer(o, result.value)));
            this.result[this.pointer] = result.value;
        }
        this.pointer++;
        return result;
    }
}
