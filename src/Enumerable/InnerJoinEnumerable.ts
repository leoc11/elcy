import { Enumerable } from "./Enumerable";

export const defaultResultFn = <T, T2, R>(item1: T | null, item2: T2 | null): R => {
    const result = {} as any;
    if (item2)
        for (const prop in item2)
            result[prop] = item2[prop];
    if (item1)
        for (const prop in item1)
            result[prop] = item1[prop];
    return result;
};
export class InnerJoinEnumerable<T = any, T2 = any, R = any> extends Enumerable<R> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T2>, protected readonly relation: (item: T, item2: T2) => boolean, protected readonly resultSelector: (item1: T, item2: T2) => R = defaultResultFn) {
        super();
    }
    protected *generator() {
        for (const value1 of this.parent) {
            for (const value2 of this.parent2) {
                if (this.relation(value1, value2)) {
                    yield this.resultSelector(value1, value2);
                }
            }
        }
    }
}
