import { Enumerable } from "./Enumerable";

export class SelectEnumerable<T = unknown, K = unknown> extends Enumerable<K> {
  constructor(
    protected override readonly parent: Enumerable<T>,
    protected readonly selector: (item: T) => K,
  ) {
    super();
  }
  protected override *generator() {
    for (const value1 of this.parent) {
      yield this.selector(value1);
    }
  }
}
