import { Enumerable } from "./Enumerable.internal";
import { GroupedEnumerable } from "./GroupedEnumerable";

const keyString = (a: unknown): string => {
  if (a == null) {
    return undefined;
  }
  if ((a as { toJSON(): string }).toJSON) {
    return (a as { toJSON(): string }).toJSON();
  }
  switch (true) {
    case a instanceof Object: {
      return JSON.stringify(
        Enumerable.from(Object.entries(a))
          .filter(([, v]) => typeof v !== "function")
          .orderBy([([k]) => k])
          .reduce((res, [k, v]) => {
            res[k] = v;
            return res;
          }, {}),
      );
    }
    case typeof a === "string": {
      return a;
    }
    default: {
      return String(a);
    }
  }
};

export class GroupByIterator<K, T> implements Iterator<T, unknown, unknown> {
  public get isDone() {
    return this._isDone;
  }
  private _isDone: boolean;
  public readonly result: GroupedEnumerable<K, T>[] = [];
  public readonly groupResultMap: Map<string, T[]> = new Map();
  constructor(
    protected readonly source: IterableIterator<T>,
    protected readonly keySelector: (item: T) => K,
  ) {}

  public next(...value: [] | [unknown]) {
    const a = this.source.next(...value);
    if (a.done !== true) {
      const key = this.keySelector(a.value);
      const keyStr = keyString(key);
      let groupResult = this.groupResultMap.get(keyStr);
      if (!groupResult) {
        groupResult = [];
        const group = new GroupedEnumerable(this, key, groupResult);
        this.result.push(group);
        this.groupResultMap.set(keyStr, groupResult);
      }
      groupResult.push(a.value);
    } else if (!this._isDone) {
      this._isDone = true;
    }
    return a;
  }
}
