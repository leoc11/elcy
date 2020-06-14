import { Enumerable, keyComparer } from "./Enumerable";
import { GroupByEnumerable } from "./GroupByEnumerable";
import { IEnumerableCache } from "./IEnumerableCache";
export class GroupedEnumerable<K, T> extends Enumerable<T> {
    public get enableCache() {
        return true;
    }
    public get keySelector() {
        return this.parent.keySelector;
    }
    constructor(protected readonly parent: GroupByEnumerable<K, T>, public readonly key: K, protected cache: IEnumerableCache) {
        super();
    }
    private _cacheResult = [];
    public addResult(value: T) {
        this._cacheResult.push(value);
    }
    protected *generator() {
        if (!this.cache.result) {
            this.cache.result = [];
        }

        let index = 0;
        for (; ;) {
            const isDone = this.cache.isDone;
            while (this._cacheResult.length > index) {
                yield this._cacheResult[index++];
            }
            if (isDone) {
                break;
            }

            const a = this.cache.iterator.next();
            if (!a.done) {
                const key = this.keySelector(a.value);
                if (keyComparer(this.key, key)) {
                    this.addResult(a.value);
                }
                else {
                    this.parent.addValue(key, a.value);
                }
            }
            else if (!this.cache.isDone) {
                this.cache.isDone = true;
                if (this.cache.iterator.return) {
                    this.cache.iterator.return();
                }
            }
        }
    }
}
