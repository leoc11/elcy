import { Enumerable, keyComparer } from "./Enumerable";
import { GroupByEnumerable } from "./GroupByEnumerable";

export class GroupedEnumerable<T, K> extends Enumerable<T> {
    public get source() {
        return this.parent.parent;
    }
    public get keySelector() {
        return this.parent.keySelector;
    }
    protected get isResultComplete(){
        return this.parent.isResultComplete;
    }
    protected set isResultComplete(value){
        this.parent.isResultComplete = value;
    }
    protected iterator: Iterator<any>;
    constructor(protected readonly parent: GroupByEnumerable<T, K>, public readonly key: K, iterator: Iterator<T>, protected parentResult: GroupedEnumerable<T, K>[]) {
        super();
        this.iterator = iterator;
    }
    public addResult(value: T) {
        this.result.push(value);
    }
    protected *generator() {
        let index = 0;
        const iterator = this.iterator;
        const result = this.result;
        const parentResult = this.parentResult;
        let iteratorResult: IteratorResult<T>;
        do {
            while (result.length > index) {
                yield result[index++];
            }

            if (iteratorResult && iteratorResult.done)
                break;

            iteratorResult = iterator.next();
            if (!iteratorResult.done) {
                const key = this.keySelector(iteratorResult.value);
                if (keyComparer(this.key, key)) {
                    result.push(iteratorResult.value);
                }
                else {
                    let group = parentResult.first((o) => keyComparer(o.key, key));
                    if (!group) {
                        group = new GroupedEnumerable(this.parent, key, iterator, this.parentResult);
                        parentResult.push(group);
                    }
                    group.addResult(iteratorResult.value);
                }
            }
        } while (true);
        this.isResultComplete = true;
    }
}
