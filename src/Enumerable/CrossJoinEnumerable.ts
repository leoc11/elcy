import { Enumerable } from "./Enumerable";
import { defaultResultFn } from "./InnerJoinEnumerable";

export class CrossJoinEnumerable<T = any, T2 = any, R = any> extends Enumerable<R> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly resultSelector: (item1: T | null, item2: T2 | null) => R = defaultResultFn) {
        super();
    }
    protected *generator() {
        for (const value1 of this.parent) {
            for (const value2 of this.parent2) {
                yield this.resultSelector(value1, value2);
            }
        }
    }
}
