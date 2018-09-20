import { Enumerable } from "./Enumerable";

export class WhereEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly predicate: (item: T) => boolean) {
        super();
    }
    protected *generator() {
        let result: T[];
        if (this.enableCache) result = [];
        for (const value of this.parent) {
            if (this.predicate(value)) {
                if (this.enableCache) result.push(value);
                yield value;
            }
        }
        if (this.enableCache) {
            this.result = result;
            this.isResultComplete = true;
        }
    }
}
