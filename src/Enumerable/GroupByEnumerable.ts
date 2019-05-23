import { Enumerable, keyComparer } from "./Enumerable";
import { GroupedEnumerable } from "./GroupedEnumerable";

export class GroupByEnumerable<K, T> extends Enumerable<GroupedEnumerable<K, T>> {
    public get enableCache() { return true; }
    constructor(public readonly parent: Enumerable<T>, public readonly keySelector: (item: T) => K) {
        super(parent as any);
    }
    public [Symbol.iterator](): IterableIterator<GroupedEnumerable<K, T>> {
        return this.generator();
    }
    public addValue(key: K, value: T) {
        let group = this.cache.result.first((o) => keyComparer(o.key, key));
        if (!group) {
            group = new GroupedEnumerable(this, key, this.cache);
            this.cache.result.push(group);
        }
        group.addResult(value);
    }
    protected *generator(): IterableIterator<GroupedEnumerable<K, T>> {
        if (!this.cache.iterator) {
            this.cache.iterator = this.parent[Symbol.iterator]();
        }
        if (!this.cache.result) {
            this.cache.result = [];
        }

        let index = 0;
        for (; ;) {
            const isDone = this.cache.isDone;
            while (this.cache.result.length > index) {
                yield this.cache.result[index++];
            }
            if (isDone) { break; }

            const a = this.cache.iterator.next();
            if (!a.done) {
                const key = this.keySelector(a.value);
                this.addValue(key, a.value);
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
