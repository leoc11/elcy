import { Enumerable } from "./Enumerable";

export class WhereEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly predicate: (item: T) => boolean) {
        super();
    }
    protected *generator() {
        const result: T[] = [];
        for (const value of this.parent) {
            if (this.predicate(value)) {
                result.push(value);
                yield value;
            }
        }
        this.result = result;
        this.isResultComplete = true;
    }
}
