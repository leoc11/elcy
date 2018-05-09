import { Enumerable } from "./Enumerable";

export class WhereEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly predicate: (item: T) => boolean) {
        super();
    }
    public *[Symbol.iterator](): IterableIterator<T> {
        if (this.isResultComplete)
            return this.result[Symbol.iterator];
        const self = this;
        return function* () {
            const result: T[] = [];
            for (const value of self.parent) {
                if (self.predicate(value)) {
                    result.push(value);
                    yield value;
                }
            }
            self.result = result;
            self.isResultComplete = true;
        };
    }
}
