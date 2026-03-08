import { Enumerable } from "./Enumerable";

export class SkipEnumerable<T = unknown> extends Enumerable<T> {
  constructor(
    protected readonly parent: Enumerable<T>,
    protected readonly skipCount: number,
  ) {
    super();
  }
  protected *generator() {
    let index = 0;
    for (const value of this.parent) {
      if (index++ < this.skipCount) {
        continue;
      }
      yield value;
    }
  }
}
