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
            let isFounded = false;
            do {
                const nResult = this.parent.next();
                if (nResult.done) {
                    this.isResultComplete = true;
                    this.resetPointer();
                    return result;
                }
                const curKey = this.keySelector(nResult.value);
                let prev = this.result.first((o) => keyComparer(curKey, o.key));
                if (!prev) {
                    prev = result.value = this.result[this.pointer] = new GroupedEnumerable(this, curKey);
                    isFounded = true;
                }
                prev.addResult(nResult.value);
            } while (!isFounded);
            result.done = false;
        }
        result.done ? this.resetPointer() : this.pointer++;
        return result;
    }
}
