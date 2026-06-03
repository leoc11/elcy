import { GroupedEnumerable } from "./GroupedEnumerable";

export class GroupByIterator<K, T> implements Iterator<T, unknown, unknown> {
  public get isDone() {
    return this._isDone;
  }
  private _isDone: boolean;
  public readonly result: GroupedEnumerable<K, T>[] = [];
  public readonly groupResultMap: Map<unknown, T[]> = new Map();
  constructor(
    protected readonly source: IterableIterator<T>,
    protected readonly keySelector: (item: T) => K,
    public readonly keyHash?: (item: K) => unknown,
  ) {}

  public next(...value: [] | [unknown]) {
    const a = this.source.next(...value);
    if (a.done !== true) {
      const key = this.keySelector(a.value);
      const keyHash = this.keyHash?.(key) ?? key;
      let groupResult = this.groupResultMap.get(keyHash);
      if (!groupResult) {
        groupResult = [];
        const group = new GroupedEnumerable(this, key, groupResult);
        this.result.push(group);
        this.groupResultMap.set(keyHash, groupResult);
      }
      groupResult.push(a.value);
    } else if (!this._isDone) {
      this._isDone = true;
    }
    return a;
  }
}
