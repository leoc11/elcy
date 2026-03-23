import { Enumerable, keyComparer } from "./Enumerable";

export class DistinctEnumerable<T = unknown> extends Enumerable<T> {
  constructor(
    protected override readonly parent: Enumerable<T>,
    protected readonly selector?: (item: T) => unknown,
  ) {
    super();
  }
  protected override *generator() {
    const result: T[] = [];
    for (const value of this.parent) {
      const key = this.selector ? this.selector(value) : value;
      if (result.findIndex((o) => keyComparer(key, o)) === -1) {
        yield value;
        result.push(value);
      }
    }
  }
}
