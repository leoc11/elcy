import { Enumerable } from "./Enumerable";

export class WhereEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly predicate: (item: T) => boolean) {
        super();
    }
    protected *generator() {
        for (const value of this.parent) {
            if (this.predicate(value)) {
                yield value;
            }
        }
    }
}
