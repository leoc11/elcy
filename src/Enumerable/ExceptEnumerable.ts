import { Enumerable, keyComparer } from "./Enumerable";

export class ExceptEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>) {
        super();
    }
    protected *generator() {
        let result: T[];
        if (this.enableCache) result = [];
        for (const value of this.parent) {
            if (!this.parent2.any(o => keyComparer(o, value))) {
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
