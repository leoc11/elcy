import { Enumerable, keyComparer } from "./Enumerable";
import { GroupByEnumerable } from "./GroupByEnumerable";

export class GroupedEnumerable<T, K> extends Enumerable<T> /*implements IGroupArray<T, K>*/ {
    public get source() {
        return this.parent.parent;
    }
    public get keySelector() {
        return this.parent.keySelector;
    }
    constructor(protected readonly parent: GroupByEnumerable<T, K>, public readonly key: K) {
        super();
    }
    public addResult(value: T) {
        this.result.push(value);
    }
    public next() {
        let result: IteratorResult<T> = {
            done: this.result.length <= this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done && !this.parent.isComplete) {
            let curKey: K | undefined;
            do {
                if (curKey && result) {
                    this.parent.addResult(curKey, result.value);
                }
                result = this.source.next();
                if (result.done) {
                    this.parent.isComplete = true;
                    this.resetPointer();
                    return result;
                }
                curKey = this.keySelector(result.value);
            } while (!keyComparer(curKey, this.key));
            this.result[this.pointer] = result.value;
            result.done = false;
        }
        result.done ? this.resetPointer() : this.pointer++;
        return result;
    }
}
