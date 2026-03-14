import { Enumerable } from "./Enumerable";

export class SliceEnumerable<T = unknown> extends Enumerable<T> {
  constructor(
    protected readonly parent: Enumerable<T>,
    protected readonly start: number,
    protected readonly end?: number,
  ) {
    super();
  }
  protected *generator() {
    if (
      typeof this.end === "number" &&
      (this.end === 0 || this.end <= this.start)
    ) {
      return;
    }

    let index = 0;
    for (const value of this.parent) {
      if (index++ < this.start) {
        continue;
      }
      if (typeof this.end === "number" && index > this.end) {
        break;
      }

      yield value;
    }
  }
}
