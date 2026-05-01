import { Enumerable } from "./Enumerable";

export class LeftJoinEnumerable<
  T = unknown,
  T2 = unknown,
  R = unknown,
> extends Enumerable<R> {
  constructor(
    protected override readonly parent: Enumerable<T>,
    protected readonly parent2: Enumerable<T2>,
    protected readonly relation: (item: T, item2: T2) => boolean,
    protected readonly resultSelector: (item1: T, item2: T2 | null) => R,
  ) {
    super();
  }
  protected override *generator() {
    for (const value1 of this.parent) {
      let hasMatch = false;
      for (const value2 of this.parent2) {
        if (this.relation(value1, value2)) {
          hasMatch = true;
          yield this.resultSelector(value1, value2);
        }
      }
      if (!hasMatch) {
        yield this.resultSelector(value1, null);
      }
    }
  }
}
