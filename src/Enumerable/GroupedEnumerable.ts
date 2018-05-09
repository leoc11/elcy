import { Enumerable, keyComparer } from "./Enumerable";
import { GroupByEnumerable } from "./GroupByEnumerable";

export class GroupedEnumerable<T, K> extends Enumerable<T> /*implements IGroupArray<T, K>*/ {
    public get source() {
        return this.parent.parent;
    }
    public get keySelector() {
        return this.parent.keySelector;
    }
    constructor(protected readonly parent: GroupByEnumerable<T, K>, public readonly key: K, protected iterator: Iterator<T>) {
        super();
    }
    public addResult(value: T) {
        this.result.push(value);
    }
    public *generator() {
        let index = 0;
        let iteratorResult: IteratorResult<T>;
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
            else {
                const key = this.keySelector(iteratorResult.value);
                if (keyComparer(this.key, key)) {
                    this.result.push(iteratorResult.value);
                    yield this.result[index++];
                }
                else {
                    this.parent.addResult(key, iteratorResult.value);
                }
            }
        } while (true);
        this.isResultComplete = true;
    }
}
