import { GenericType } from "./Interface/Type";
import { IEnumerableCache } from "./IEnumerableCache";
import { IEnumerable } from "./IEnumerable";

export class Enumerable<T = unknown> implements IEnumerable<T> {
  public enableCache(value: boolean = true) {
    if (this.parent) {
      if (value) {
        if (!this.cache) {
          this.cache = {};
        }
        this.cache.enabled = true;
      } else if (this.cache) {
        this.cache = undefined;
      }
    }

    return this;
  }

  constructor(source?: Iterable<unknown>) {
    if (source) {
      if (Array.isArray(source)) {
        this.cache = {
          enabled: true,
          result: source,
          isDone: true,
        };
      }
      if ((source as IterableIterator<T>).next) {
        this.cache = {
          enabled: true,
          iterator: source as IterableIterator<T>,
        };
      } else {
        this.parent = source;
      }
    }
  }
  public static from<T>(source: Iterable<T>): Enumerable<T> {
    return source instanceof Enumerable
      ? (source as Enumerable<T>)
      : new Enumerable(source);
  }
  public static range(start: number, end: number, step: number = 1) {
    return new Enumerable<number>(
      (function* () {
        while (start <= end) {
          yield start;
          start += step;
        }
      })(),
    );
  }
  protected cache: IEnumerableCache<T>;
  protected parent: Iterable<unknown>;
  public [Symbol.iterator](): IterableIterator<T> {
    if (this.cache?.enabled) {
      return this.cachedGenerator();
    }
    return this.generator();
  }
  public every(predicate: (item: T) => boolean): boolean {
    for (const item of this) {
      if (!predicate(item)) {
        return false;
      }
    }
    return true;
  }
  public some(predicate?: (item: T) => boolean): boolean {
    for (const item of this) {
      if (!predicate || predicate(item)) {
        return true;
      }
    }
    return false;
  }
  public avg(selector?: (item: T) => number): number | null {
    let sum = 0;
    let count = 0;
    for (const item of this) {
      sum += selector ? selector(item) : (item as number);
      count++;
    }
    return count === 0 ? null : sum / count;
  }
  public includes(item: T): boolean {
    for (const it of this) {
      if (it === item) {
        return true;
      }
    }
    return false;
  }
  public count(predicate?: (item: T) => boolean): number {
    let count = 0;
    for (const item of this) {
      if (!predicate || predicate(item)) {
        count++;
      }
    }
    return count;
  }

  // Helper extension
  public each(executor: (item: T, index: number) => void): void {
    let index = 0;
    for (const item of this) {
      executor(item, index++);
    }
  }
  public find(predicate?: (item: T) => boolean): T | undefined {
    for (const item of this) {
      if (!predicate || predicate(item)) {
        return item;
      }
    }
    return undefined;
  }
  public max(selector?: (item: T) => number): number {
    let max = null;
    for (const item of this) {
      const num = selector ? selector(item) : (item as number);
      if (max < num) {
        max = num;
      }
    }
    return max;
  }
  public min(selector?: (item: T) => number): number {
    let min = null;
    for (const item of this) {
      const num = selector ? selector(item) : (item as number);
      if (!min || min > num) {
        min = num;
      }
    }
    return min;
  }
  public ofType<TType>(type: GenericType<TType>): Enumerable<TType> {
    return this.filter(
      (o) => o instanceof type || o?.constructor === type,
    ) as unknown as Enumerable<TType>;
  }
  public reduce<R = T>(
    callbackfn: (previousValue: R, currentValue: T) => R,
    initialValue?: R,
  ): R {
    let accumulated = initialValue;
    for (const a of this) {
      accumulated = callbackfn(accumulated, a);
    }
    return accumulated;
  }
  public sum(selector?: (item: T) => number): number {
    let sum = 0;
    for (const item of this) {
      sum += selector ? selector(item) : (item as number);
    }
    return sum;
  }
  public toArray(): T[] {
    if (this.cache?.enabled && this.cache?.isDone) {
      return this.cache.result.slice(0);
    }

    return Array.from(this);
  }
  public toSet(): Set<T> {
    return new Set(this);
  }
  public toMap<K, V = T>(
    keySelector: (item: T) => K,
    valueSelector?: (item: T) => V,
  ): Map<K, V> {
    const rel = new Map<K, V>();
    for (const i of this) {
      rel.set(
        keySelector(i),
        valueSelector ? valueSelector(i) : (i as unknown as V),
      );
    }
    return rel;
  }
  protected *generator() {
    console.log("triggered");
    for (const value of this.parent) {
      yield value as T;
    }
  }
  private *cachedGenerator() {
    if (this.cache.isDone) {
      yield* this.cache.result;
      return;
    }

    const canReturn = !this.cache.iterator;
    if (!this.cache.iterator) {
      this.cache.iterator = this.generator?.();
      this.cache.result = [];
    } else if (!this.cache.result) {
      this.cache.result = [];
    }
    const iterator = this.cache.iterator as IterableIterator<T> & {
      _accessCount: number;
    };
    if (iterator && !iterator._accessCount) {
      iterator._accessCount = 0;
    }
    iterator._accessCount++;
    try {
      let index = 0;
      for (;;) {
        const isDone = this.cache.isDone;
        const len = this.cache.result.length;
        while (len > index) {
          yield this.cache.result[index++];
        }
        if (isDone) {
          break;
        }

        const a = iterator.next();
        if (a.done !== true) {
          this.cache.result.push(a.value);
        } else if (!this.cache.isDone) {
          this.cache.isDone = true;
        }
      }
    } finally {
      iterator._accessCount--;
      if (canReturn && iterator.return && iterator._accessCount <= 0) {
        iterator.return();
        if (this.cache.iterator === iterator) {
          this.cache.iterator = null;
        }
      }
    }
  }
}
