import { Enumerable, keyComparer } from "./Enumerable";
import { GroupedEnumerable } from "./GroupedEnumerable";

export class GroupByEnumerable<K = unknown, T = unknown> extends Enumerable<GroupedEnumerable<K, T>> {
    public get enableCache() {
        return true;
    }
    constructor(public readonly parent: Enumerable<T>, public readonly keySelector: (item: T) => K) {
        super(parent);
    }
    public [Symbol.iterator](): IterableIterator<GroupedEnumerable<K, T>> {
        return this.generator();
    }
    public addValue(key: K, value: T) {
        let group = this.cache.result.find((o) => keyComparer(o.key, key));
        if (!group) {
            group = new GroupedEnumerable(this, key, { iterator: this.sourceIterator });
            this.cache.result.push(group);
        }
        group.addResult(value);
    }
    private sourceIterator: IterableIterator<T>;
    protected *generator() {
        if (!this.sourceIterator) {
            this.sourceIterator = this.parent[Symbol.iterator]();
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
            if (isDone) {
                break;
            }

            const a = this.sourceIterator.next();
            if (a.done !== true) {
                const key = this.keySelector(a.value);
                this.addValue(key, a.value);
            }
            else if (!this.cache.isDone) {
                this.cache.isDone = true;
                if (this.sourceIterator.return) {
                    this.sourceIterator.return();
                }
            }
        }
    }
}
