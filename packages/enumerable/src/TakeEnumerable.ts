import { Enumerable } from "./Enumerable";

export class TakeEnumerable<T = unknown> extends Enumerable<T> {
  constructor(
    protected readonly parent: Enumerable<T>,
    protected readonly takeCount: number,
  ) {
    super();
  }
  protected *generator() {
    let index = 0;
    for (const value of this.parent) {
      yield value;
      if (++index >= this.takeCount) {
        break;
      }
    }
  }
}
