import { Enumerable, keyComparer } from "./Enumerable";

export class ExceptEnumerable<T = unknown> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>) {
        super();
    }
    protected *generator() {
        for (const value of this.parent) {
            if (!this.parent2.some((o) => keyComparer(o, value))) {
                yield value;
            }
        }
    }
}
