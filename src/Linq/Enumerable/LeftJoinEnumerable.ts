import { Enumerable, keyComparer } from "./Enumerable";
import { defaultResultFn } from "./InnerJoinEnumerable";

function* leftjoin<T, T2, K, R>(enumerable1: Enumerable<T>, enumerable2: Enumerable<T2>, keySelector1: (item: T) => K, keySelector2: (item: T2) => K, resultSelector: (item1: T, item2: T2 | null) => R) {
    enumerable1.resetPointer();
    let result1 = enumerable1.next();
    while (!result1.done) {
        const key1 = keySelector1(result1.value);
        enumerable2.resetPointer();
        let result2 = enumerable2.next();
        let hasMatch = false;
        while (!result2.done) {
            if (keyComparer(key1, keySelector2(result2.value))) {
                hasMatch = true;
                yield resultSelector(result1.value, result2.value);
            }
            result2 = enumerable2.next();
        }
        if (hasMatch) {
            yield resultSelector(result1.value, null);
        }
        result1 = enumerable1.next();
    }
}
export class LeftJoinEnumerable<T = any, T2 = any, K = any, R = any> extends Enumerable<R> {
    private generator: IterableIterator<any>;
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly keySelector1: (item: T) => K, protected readonly keySelector2: (item: T2) => K, protected readonly resultSelector: (item1: T, item2: T2 | null) => R = defaultResultFn) {
        super();
        this.generator = leftjoin(parent, parent2, keySelector1, keySelector2, resultSelector);
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next() {
        let result: IteratorResult<R> = {
            done: this.result.length <= this.pointer,
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
