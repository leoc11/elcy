import { Enumerable } from "./Enumerable";
import { defaultResultFn } from "./InnerJoinEnumerable";

export class RightJoinEnumerable<T = any, T2 = any, R = any> extends Enumerable<R> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly relation: (item: T, item2: T2) => boolean, protected readonly resultSelector: (item1: T | null, item2: T2) => R = defaultResultFn) {
        super();
    }
    protected *generator() {
        const result: R[] = [];
        const array2 = this.parent2.toArray();
        for (const value1 of this.parent) {
            for (const value2 of this.parent2) {
                if (this.relation(value1, value2)) {
                    const value = this.resultSelector(value1, value2);
                    result.push(value);
                    yield value;
                    array2.remove(value2);
                }
            }
        }
        for (const value2 of array2) {
            const value = this.resultSelector(null, value2);
            result.push(value);
            yield value;
        }
        this.result = result;
        this.isResultComplete = true;
    }
}
