import { Enumerable, keyComparer } from "./Enumerable";
import { GroupedEnumerable } from "./GroupedEnumerable";

export class GroupByEnumerable<T, K> extends Enumerable<GroupedEnumerable<T, K>> {
    constructor(public readonly parent: Enumerable<T>, public readonly keySelector: (item: T) => K) {
        super();
    }
    public get isComplete() {
        return this.isResultComplete;
    }
    public set isComplete(value: boolean) {
        this.isResultComplete = value;
    }
    public iterator: Iterator<T>;
    public addResult(key: K, value: T) {
        let group = this.result.first((o) => keyComparer(o.key, key));
        if (!group) {
            group = new GroupedEnumerable(this, key, this.iterator);
            group.addResult(value);
            this.result.push(group);
        }
        group.addResult(value);
    }
    public *generator() {
        this.iterator = this.parent[Symbol.iterator]();
        let iteratorResult: IteratorResult<T>;
        let index = 0;
        do {
            while (this.result.length > index) {
                yield this.result[index++];
            }
            iteratorResult = this.iterator.next();
            if (iteratorResult.done) {
                while (this.result.length > index) {
                    yield this.result[index++];
                }
                break;
            }
            const key = this.keySelector(iteratorResult.value);
            let prev = this.result.first((o) => keyComparer(key, o.key));
            if (!prev) {
                const value = new GroupedEnumerable<T, K>(this, key, this.iterator);
                value.addResult(iteratorResult.value);
                this.result.push(value);
                yield this.result[index++];
            }
            else {
                prev.addResult(iteratorResult.value);
            }
        } while (true);
        this.isResultComplete = true;
    }
}
