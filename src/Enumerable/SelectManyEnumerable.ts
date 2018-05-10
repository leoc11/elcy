import { Enumerable } from "./Enumerable";

export class SelectManyEnumerable<T = any, K = any> extends Enumerable<K> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector: (item: T) => K[] | Enumerable<K>) {
        super();
    }
    protected *generator() {
        const result: K[] = [];
        for (const value1 of this.parent) {
            const values = this.selector(value1);
            for (const value of values) {
                result.push(value);
                yield value;
            }
        }
        this.result = result;
        this.isResultComplete = true;
    }
}
