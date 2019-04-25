import { Enumerable } from "./Enumerable";
import { defaultResultFn } from "./InnerJoinEnumerable";

export class GroupJoinEnumerable<T = any, T2 = any, R = any> extends Enumerable<R> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly relation: (item: T, item2: T2) => boolean, protected readonly resultSelector: (item1: T, item2: T2[]) => R = defaultResultFn) {
        super();
    }
    protected *generator() {
        for (const value1 of this.parent) {
            const value2 = [];
            for (const item of this.parent2) {
                if (this.relation(value1, item)) {
                    value2.push(item);
                }
            }
            yield this.resultSelector(value1, value2);
        }
    }
}
