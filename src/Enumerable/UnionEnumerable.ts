import { Enumerable, keyComparer } from "./Enumerable";

export class UnionEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly parent2: Enumerable<T>, public readonly isUnionAll = false) {
        super();
    }
    protected *generator() {
        const result: T[] = [];
        for (const value of this.parent) {
            if (this.isUnionAll || !result.any(o => keyComparer(o, value))) {
                result.push(value);
                yield value;
            }
        }
        for (const value of this.parent2) {
            if (this.isUnionAll || !result.any(o => keyComparer(o, value))) {
                result.push(value);
                yield value;
            }
        }
        this.result = result;
        this.isResultComplete = true;
    }
}
