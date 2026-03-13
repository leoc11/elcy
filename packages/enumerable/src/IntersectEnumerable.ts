import { Enumerable, keyComparer } from "./Enumerable";

export class IntersectEnumerable<T = unknown> extends Enumerable<T> {
  constructor(
    ...parents: [Enumerable<T>, Enumerable<T>, ...Enumerable<T>[]]
  ) {
    super(parents[0]);
    this.parents = parents;
  }
  declare protected parent: Enumerable<T>;
  protected parents: Enumerable<T>[];
  protected *generator() {
    const parent2 = Enumerable.from([]).union(...this.parents.slice(1) as [Enumerable<T>, ...Enumerable<T>[]]).enableCache(true);
    for (const value of this.parent) {
      for (const value2 of parent2) {
        if (keyComparer(value, value2)) {
          yield value;
        }
      }
    }
  }
}
