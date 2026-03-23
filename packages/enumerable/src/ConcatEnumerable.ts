import { Enumerable } from "./Enumerable";

export class ConcatEnumerable<T = unknown> extends Enumerable<T> {
  constructor(...parents: [Enumerable<T>, Enumerable<T>, ...Enumerable<T>[]]) {
    super(parents[0]);
    this.parents = parents;
  }
  declare protected parent: Enumerable<T>;
  protected parents: Enumerable<T>[];
  protected override *generator() {
    for (const parent of this.parents) {
      for (const value of parent) {
        yield value;
      }
    }
  }
}
