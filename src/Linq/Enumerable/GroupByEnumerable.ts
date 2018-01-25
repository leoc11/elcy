import { Enumerable, keyComparer } from "./Enumerable";
import { GroupedEnumerable } from "./GroupedEnumerable";

export class GroupByEnumerable<T, K> extends Enumerable<GroupedEnumerable<T, K>> {
    constructor(public readonly parent: Enumerable<T>, public readonly keySelector: (item: T) => K) {
        super();
    }
    public [Symbol.iterator]() {
        return this;
    }
    public get isComplete() {
        return this.isResultComplete;
    }
    public set isComplete(value: boolean) {
        this.isResultComplete = value;
    }
    public addResult(key: K, value: T) {
        let group = this.result.first((o) => keyComparer(o.key, key));
        if (!group) {
            group = new GroupedEnumerable(this, key);
            this.result.push(group);
        }
        group.addResult(value);
    }
    public next(): IteratorResult<GroupedEnumerable<T, K>> {
        const result: IteratorResult<GroupedEnumerable<T, K>> = {
            done: this.result.length <= this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done && !this.isResultComplete) {
            let curKey: K | undefined;
            let nResult: IteratorResult<T> | undefined;
            do {
                nResult = this.parent.next();
                if (nResult.done) {
                    this.isResultComplete = true;
                    this.resetPointer();
                    return result;
                }
                curKey = this.keySelector(nResult.value);
            } while (this.result.any((o) => keyComparer(curKey, o.key)));
            result.value = this.result[this.pointer] = new GroupedEnumerable(this, curKey);
            this.result[this.pointer].addResult(nResult.value);
            result.done = false;
        }
        this.pointer++;
        return result;
    }
}
