import { Enumerable, keyComparer } from "./Enumerable";
import { GroupedEnumerable } from "./GroupedEnumerable";

export class GroupByEnumerable<T, K> extends Enumerable<GroupedEnumerable<T, K>> {
    constructor(public readonly parent: Enumerable<T>, public readonly keySelector: (item: T) => K) {
        super(parent);
    }
    public isResultComplete: boolean;
    protected *generator() {
        const iterator = this.iterator;
        const result = this.result;

        let iteratorResult: IteratorResult<T>;
        let index = 0;
        do {
            while (result.length > index) {
                yield result[index++];
            }

            if (iteratorResult && iteratorResult.done)
                break;

            iteratorResult = iterator.next();
            if (!iteratorResult.done) {
                const key = this.keySelector(iteratorResult.value);
                let prev = result.first((o) => keyComparer(key, o.key));
                if (!prev) {
                    const value = new GroupedEnumerable<T, K>(this, key, iterator, result);
                    value.addResult(iteratorResult.value);
                    result.push(value);
                }
                else {
                    prev.addResult(iteratorResult.value);
                }
            }
        } while (true);

        if (result === this.result)
            this.isResultComplete = true;
    }
}
