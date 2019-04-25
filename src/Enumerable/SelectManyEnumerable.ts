import { Enumerable } from "./Enumerable";

export class SelectManyEnumerable<T = any, K = any> extends Enumerable<K> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector: (item: T) => (K[] | Enumerable<K>)) {
        super();
    }
    protected *generator() {
        for (const value1 of this.parent) {
            const values = this.selector(value1);
            if (values) {
                for (const value of values) {
                    yield value;
                }
            }
        }
    }
}
