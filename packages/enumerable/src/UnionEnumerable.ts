import { Enumerable, keyComparer } from "./Enumerable";

export class UnionEnumerable<T = unknown> extends Enumerable<T> {
  constructor(...parents: [Enumerable<T>, Enumerable<T>, ...Enumerable<T>[]]) {
    super(parents[0]);
    this.parents = parents;
  }
  declare protected parent: Enumerable<T>;
  protected parents: Enumerable<T>[];
  protected override *generator() {
    const result: T[] = [];
    for (const parent of this.parents) {
      for (const value of parent) {
        if (!result.some((o) => keyComparer(o, value))) {
          yield value;
          result.push(value);
        }
      }
    }
  }
}
