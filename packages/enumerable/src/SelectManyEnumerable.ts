import { Enumerable } from "./Enumerable";
import { IEnumerable } from "./IEnumerable";

export class SelectManyEnumerable<
  T = unknown,
  K = unknown,
> extends Enumerable<K> {
  constructor(
    protected readonly parent: Enumerable<T>,
    protected readonly selector: (item: T) => IEnumerable<K>,
  ) {
    super();
  }
  protected *generator() {
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
