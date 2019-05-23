import { Enumerable, keyComparer } from "./Enumerable";

export class UnionEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>, public readonly isUnionAll = false) {
        super();
    }
    protected *generator() {
        if (this.isUnionAll) {
            for (const value of this.parent) { yield value; }
            for (const value of this.parent2) { yield value; }
        }
        else {
            const result: T[] = [];
            for (const value of this.parent) {
                if (!result.any((o) => keyComparer(o, value))) {
                    yield value;
                    result.push(value);
                }
            }
            for (const value of this.parent2) {
                if (!result.any((o) => keyComparer(o, value))) {
                    yield value;
                    result.push(value);
                }
            }
        }
    }
}
