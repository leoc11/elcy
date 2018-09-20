import { Enumerable, keyComparer } from "./Enumerable";

export class DistinctEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector?: (item: T) => any) {
        super();
    }
    protected *generator() {
        const result: T[] = [];
        for (const value of this.parent) {
            const key = this.selector ? this.selector(value) : value;
            if (!result.any(o => keyComparer(key, o))) {
                result.push(value);
                yield value;
            }
        }
        if (this.enableCache) {
            this.result = result;
            this.isResultComplete = true;
        }
    }
}
