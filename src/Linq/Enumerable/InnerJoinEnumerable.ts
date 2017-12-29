import { Enumerable, keyComparer } from "./Enumerable";

function* innerjoin<T, T2, K, R>(enumerable1: Enumerable<T>, enumerable2: Enumerable<T2>, keySelector1: (item: T) => K, keySelector2: (item: T2) => K, resultSelector: (item1: T, item2: T2) => R) {
    enumerable1.resetPointer();
    let result1 = enumerable1.next();
    while (!result1.done) {
        const key1 = keySelector1(result1.value);
        enumerable2.resetPointer();
        let result2 = enumerable2.next();
        while (!result2.done) {
            if (keyComparer(key1, keySelector2(result2.value)))
                yield resultSelector(result1.value, result2.value);
            result2 = enumerable2.next();
        }
        result1 = enumerable1.next();
    }
}
export class JoinEnumerable<T = any, T2 = any, K = any, R = any> extends Enumerable<R> {
    private generator: IterableIterator<any>;
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly keySelector1: (item: T) => K, protected readonly keySelector2: (item: T2) => K, protected readonly resultSelector: (item1: T, item2: T2) => R) {
        super();
        this.generator = innerjoin(parent, parent2, keySelector1, keySelector2, resultSelector);
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
