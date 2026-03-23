import { Enumerable } from "./Enumerable";
import type { GroupByIterator } from "./GroupByIterator";

export class GroupedEnumerable<K = unknown, T = unknown> extends Enumerable<T> {
  constructor(
    protected readonly iterator: GroupByIterator<K, T>,
    public readonly key: K,
    result: T[],
  ) {
    super();
    this.cache = {
      enabled: true,
      result: result,
    };
  }
  public override [Symbol.iterator](): IterableIterator<T> {
    return this.generator();
  }
  protected override *generator() {
    let index = 0;
    for (;;) {
      const isDone = this.cache.isDone;
      const len = this.cache.result.length;
      while (len > index) {
        yield this.cache.result[index++];
      }

      if (isDone) {
        break;
      }

      const a = this.iterator.next();
      if (a.done && !this.cache.isDone) {
        this.cache.isDone = true;
      }
    }
  }
}
