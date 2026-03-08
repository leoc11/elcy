import { defaultResultFn, Enumerable } from "./Enumerable";

export class FullJoinEnumerable<T = unknown, T2 = unknown, R = unknown> extends Enumerable<R> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly relation: (item: T, item2: T2) => boolean, protected readonly resultSelector: (item1: T | null, item2: T2 | null) => R = defaultResultFn) {
        super();
    }
    protected *generator() {
        const array2 = this.parent2.toArray();
        for (const value1 of this.parent) {
            let hasMatch = false;
            for (const value2 of this.parent2) {
                if (this.relation(value1, value2)) {
                    hasMatch = true;
                    yield this.resultSelector(value1, value2);
                    const index = array2.indexOf(value2);
                    if (index !== -1) {
                        array2.splice(index, 1);
                    }
                }
            }

            if (!hasMatch) {
                yield this.resultSelector(value1, null);
            }
        }
        for (const value2 of array2) {
            yield this.resultSelector(null, value2);
        }
    }
}
