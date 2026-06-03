import { Enumerable } from "./Enumerable";

export class SelectManyEnumerable<
  T = unknown,
  K = unknown,
> extends Enumerable<K> {
  constructor(
    protected override readonly parent: Enumerable<T>,
    protected readonly selector: (item: T) => Iterable<K>,
  ) {
    super();
  }
  protected override *generator() {
    for (const value1 of this.parent) {
      const values = this.selector(value1);
      if (values) {
        for (const value of values) {
          yield value;
        }
      }
    }
  }
}
