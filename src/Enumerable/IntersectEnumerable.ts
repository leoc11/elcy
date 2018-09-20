import { Enumerable } from "./Enumerable";
import { keyComparer } from "./Enumerable";

export class IntersectEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>) {
        super();
    }
    protected *generator() {
        let result: T[];
        if (this.enableCache) result = [];
        for (const value of this.parent) {
            for (const value2 of this.parent2) {
                if (keyComparer(value, value2)) {
                    if (this.enableCache) result.push(value);
                    yield value;
                }
            }
        }
        if (this.enableCache) {
            this.result = result;
            this.isResultComplete = true;
        }
    }
}
