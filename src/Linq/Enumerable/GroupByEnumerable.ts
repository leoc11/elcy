import { Enumerable } from "./Enumerable";
import { GroupedEnumerable } from "./GroupedEnumerable";

export class GroupByEnumerable<T, K> extends Enumerable<GroupedEnumerable<T, K>> {
    constructor(public readonly parent: Enumerable<T>, public readonly keySelector: (item: T) => K, protected readonly isJSONCompare = false) {
        super();
    }
    public [Symbol.iterator]() {
        return this;
    }
    public addResult(key: K, value: T) {
        let group = this.result.first((o) => key instanceof Object ? JSON.stringify(o.key) === JSON.stringify(key) : o.key === key);
        if (!group)
            group = new GroupedEnumerable(this, key);
        group.addResult(value);
    }
    public next(): IteratorResult<GroupedEnumerable<T, K>> {
        const result: IteratorResult<GroupedEnumerable<T, K>> = {
            done: this.result.length < this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done && !this.isResultComplete) {
            const prevResult = this.result[this.pointer - 1];
            let curKey: K | undefined;
            let nResult: IteratorResult<T> | undefined;
            do {
                if (curKey && nResult) {
                    prevResult.addResult(nResult.value);
                }
                nResult = this.parent.next();
                if (result.done) {
                    this.isResultComplete = true;
                    return result;
                }
                curKey = this.keySelector(nResult.value);
            } while (this.keyComparer(curKey, prevResult.key));
            result.value = this.result[this.pointer] = new GroupedEnumerable(this, curKey);
            this.result[this.pointer].addResult(nResult.value);
            result.done = false;
        }
        this.reversepointer++;
        return result;
    }
    private keyComparer = (a: K, b: K) => a instanceof Object ? JSON.stringify(a) === JSON.stringify(b) : a === b;
}
