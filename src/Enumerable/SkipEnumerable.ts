import { Enumerable } from "./Enumerable";

export class SkipEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly skipCount: number) {
        super();
    }
    protected *generator() {
        let result: T[];
        if (this.enableCache) result = [];
        let index = 0;
        for (const value of this.parent) {
            if (index++ < this.skipCount)
                continue;

            if (this.enableCache) result.push(value);
            yield value;
        }
        if (this.enableCache) {
            this.result = result;
            this.isResultComplete = true;
        }
    }
}
