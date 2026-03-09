import { Enumerable } from "./Enumerable";

export class GroupJoinEnumerable<
  T = unknown,
  T2 = unknown,
  R = unknown,
> extends Enumerable<R> {
  constructor(
    protected readonly parent: Enumerable<T>,
    protected readonly parent2: Enumerable<T2>,
    protected readonly relation: (item: T, item2: T2) => boolean,
    protected readonly resultSelector: (item1: T, item2: Enumerable<T2>) => R,
  ) {
    super();
  }
  protected *generator() {
    for (const value1 of this.parent) {
      const value2 = this.parent2.filter((item) => this.relation(value1, item));
      yield this.resultSelector(value1, value2);
    }
  }
}
