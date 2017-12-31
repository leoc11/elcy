import { Enumerable, keyComparer } from "./Enumerable";
import { defaultResultFn } from "./InnerJoinEnumerable";

function* fulljoin<T, T2, K, R>(enumerable1: Enumerable<T>, enumerable2: Enumerable<T2>, keySelector1: (item: T) => K, keySelector2: (item: T2) => K, resultSelector: (item1: T | null, item2: T2 | null) => R) {
    enumerable1.resetPointer();
    let result1 = enumerable1.next();
    const enum2array = enumerable2.toArray();
    while (!result1.done) {
        const key1 = keySelector1(result1.value);
        enumerable2.resetPointer();
        let result2 = enumerable2.next();
        let hasMatch = false;
        while (!result2.done) {
            if (keyComparer(key1, keySelector2(result2.value))) {
                hasMatch = true;
                yield resultSelector(result1.value, result2.value);
                enum2array.remove(result2.value);
            }
            result2 = enumerable2.next();
        }
        if (hasMatch) {
            yield resultSelector(result1.value, null);
        }
        result1 = enumerable1.next();
    }
    while (enum2array.length > 0) {
        yield resultSelector(null, enum2array.shift() as T2);
    }
}
export class FullJoinEnumerable<T = any, T2 = any, K = any, R = any> extends Enumerable<R> {
    private generator: IterableIterator<any>;
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly keySelector1: (item: T) => K, protected readonly keySelector2: (item: T2) => K, protected readonly resultSelector: (item1: T | null, item2: T2 | null) => R = defaultResultFn) {
        super();
        this.generator = fulljoin(parent, parent2, keySelector1, keySelector2, resultSelector);
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next() {
        let result: IteratorResult<R> = {
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
    // public next(): IteratorResult<R> {
    //     const result: IteratorResult<R> = {
    //         done: this.result.length < this.pointer,
    //         value: this.result[this.pointer]
    //     };
    //     if (result.done && !this.isResultComplete) {
    //         let result1 = this.parent.next();
    //         while (!result1.done) {
    //             const key1 = this.keySelector1(result1.value);
    //             let result2 = this.parent2.next();
    //             while (!result2.done && !keyComparer(key1, this.keySelector2(result2.value))) {
    //                 result2 = this.parent2.next();
    //             }
    //             if (result2.done) {
    //                 result1 = this.parent.next();
    //                 continue;
    //             }
    //             result.value = this.result[this.pointer] = this.resultSelector(result1.value, result2.value);
    //             result.done = false;
    //             break;
    //         }
    //         return result;
    //     }

    //     this.pointer++;
    //     return result;
    // }
}
