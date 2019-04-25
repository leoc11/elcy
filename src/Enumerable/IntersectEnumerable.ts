import { Enumerable } from "./Enumerable";
import { keyComparer } from "./Enumerable";

export class IntersectEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>) {
        super();
    }
    protected *generator() {
        for (const value of this.parent) {
            for (const value2 of this.parent2) {
                if (keyComparer(value, value2)) {
                    yield value;
                }
            }
        }
    }
}
