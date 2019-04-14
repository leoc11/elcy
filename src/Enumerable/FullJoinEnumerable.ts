import { Enumerable } from "./Enumerable";
import { defaultResultFn } from "./InnerJoinEnumerable";

export class FullJoinEnumerable<T = any, T2 = any, R = any> extends Enumerable<R> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly relation: (item: T, item2: T2) => boolean, protected readonly resultSelector: (item1: T | null, item2: T2 | null) => R = defaultResultFn) {
        super();
    }
    protected *generator() {
        let result: R[];
        if (this.enableCache) result = [];
        const array2 = this.parent2.toArray();
        for (const value1 of this.parent) {
            let hasMatch = false;
            for (const value2 of this.parent2) {
                if (this.relation(value1, value2)) {
                    hasMatch = true;
                    const value = this.resultSelector(value1, value2);
                    if (this.enableCache) result.push(value);
                    yield value;
                    array2.delete(value2);
                }
            }
            if (!hasMatch) {
                const value = this.resultSelector(value1, null);
                if (this.enableCache) result.push(value);
                yield value;
            }
        }
        for (const value2 of array2) {
            const value = this.resultSelector(null, value2);
            if (this.enableCache) result.push(value);
            yield value;
        }
        if (this.enableCache) {
            this.result = result;
            this.isResultComplete = true;
        }
    }
}
