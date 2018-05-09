import { Enumerable } from "./Enumerable";

export class SelectEnumerable<T = any, K = any> extends Enumerable<K> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector: (item: T) => K) {
        super();
    }
    public *generator() {
        const result: K[] = [];
        for (const value1 of this.parent) {
            const value = this.selector(value1);
            result.push(value);
            yield value;
        }
        this.result = result;
        this.isResultComplete = true;
    }
}
