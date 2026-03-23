import { Enumerable } from "./Enumerable";

export class WhereEnumerable<T = unknown> extends Enumerable<T> {
  constructor(
    protected override readonly parent: Enumerable<T>,
    protected readonly predicate: (item: T) => boolean,
  ) {
    super();
  }
  protected override *generator() {
    for (const value of this.parent) {
      if (this.predicate(value)) {
        yield value;
      }
    }
  }
}
