import { Enumerable, keyComparer } from "./Enumerable";

export class ExceptEnumerable<T = unknown> extends Enumerable<T> {
  constructor(...parents: [Enumerable<T>, Enumerable<T>, ...Enumerable<T>[]]) {
    super(parents[0]);
    this.parents = parents;
  }
  declare protected parent: Enumerable<T>;
  protected parents: Enumerable<T>[];
  protected *generator() {
    const parent2 = Enumerable.from([])
      .union(...(this.parents.slice(1) as [Enumerable<T>, ...Enumerable<T>[]]))
      .enableCache(true);
    for (const value of this.parent) {
      if (!parent2.some((o) => keyComparer(o, value))) {
        yield value;
      }
    }
  }
}
