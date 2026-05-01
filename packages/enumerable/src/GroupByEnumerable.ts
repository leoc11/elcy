import { Enumerable } from "./Enumerable";
import { GroupByIterator } from "./GroupByIterator";
import { GroupedEnumerable } from "./GroupedEnumerable";

export class GroupByEnumerable<K = unknown, T = unknown> extends Enumerable<
  GroupedEnumerable<K, T>
> {
  constructor(
    public override readonly parent: Enumerable<T>,
    public readonly keySelector: (item: T) => K,
  ) {
    super(parent);
  }
  protected override *generator() {
    const source = this.parent[Symbol.iterator]();
    const iterator = new GroupByIterator(source, this.keySelector);
    let index = 0;
    for (;;) {
      const isDone = iterator.isDone;
      const len = iterator.result.length;
      while (len > index) {
        yield iterator.result[index++];
      }

      if (isDone) {
        break;
      }

      iterator.next();
    }
  }
}
