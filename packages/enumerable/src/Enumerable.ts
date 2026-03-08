import { Pivot } from "./Interface/Type";
import { Enumerable } from "./Enumerable.internal";
import { CrossJoinEnumerable } from "./CrossJoinEnumerable";
import { DistinctEnumerable } from "./DistinctEnumerable";
import { ExceptEnumerable } from "./ExceptEnumerable";
import { FullJoinEnumerable } from "./FullJoinEnumerable";
import { GroupByEnumerable } from "./GroupByEnumerable";
import { GroupJoinEnumerable } from "./GroupJoinEnumerable";
import { IEnumerable } from "./IEnumerable";
import { InnerJoinEnumerable } from "./InnerJoinEnumerable";
import { IOrderDefinition } from "./Interface/IOrderDefinition";
import { IntersectEnumerable } from "./IntersectEnumerable";
import { LeftJoinEnumerable } from "./LeftJoinEnumerable";
import { OrderEnumerable } from "./OrderEnumerable";
import { RightJoinEnumerable } from "./RightJoinEnumerable";
import { SelectEnumerable } from "./SelectEnumerable";
import { SelectManyEnumerable } from "./SelectManyEnumerable";
import { SkipEnumerable } from "./SkipEnumerable";
import { TakeEnumerable } from "./TakeEnumerable";
import { UnionEnumerable } from "./UnionEnumerable";
import { WhereEnumerable } from "./WhereEnumerable";

declare module "./Enumerable" {
  interface Enumerable<T> {
    cast<TReturn>(): Enumerable<TReturn>;
    crossJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      resultSelector: (item1: T, item2: T2) => TResult,
    ): Enumerable<TResult>;
    distinct(selector?: (item: T) => unknown): Enumerable<T>;
    except(array2: IEnumerable<T>): Enumerable<T>;
    fullJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T | null, item2: T2 | null) => TResult,
    ): Enumerable<TResult>;
    groupBy<K>(keySelector: (item: T) => K): GroupByEnumerable<K, T>;
    groupJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T, item2: T2[]) => TResult,
    ): Enumerable<TResult>;
    innerJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T, item2: T2) => TResult,
    ): Enumerable<TResult>;
    intersect(array2: IEnumerable<T>): Enumerable<T>;
    leftJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T, item2: T2 | null) => TResult,
    ): Enumerable<TResult>;
    orderBy(...selectors: Array<IOrderDefinition<T>>): Enumerable<T>;
    pivot<
      TD extends { [key: string]: (item: T) => unknown },
      TM extends { [key: string]: (item: T[]) => unknown },
    >(
      dimensions: TD,
      metrics: TM,
    ): Enumerable<Pivot<T, TD, TM>>;
    rightJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T | null, item2: T2) => TResult,
    ): Enumerable<TResult>;
    map<TReturn>(selector: (item: T) => TReturn): Enumerable<TReturn>;
    flatMap<TReturn>(
      selector: (item: T) => Iterable<TReturn>,
    ): Enumerable<TReturn>;
    skip(skip: number): Enumerable<T>;
    take(take: number): Enumerable<T>;
    slice(skip: number, take: number): Enumerable<T>;
    union(array2: IEnumerable<T>): Enumerable<T>;
    concat(...items: Iterable<T>[]): Enumerable<T>;
    filter(predicate: (item: T) => boolean): Enumerable<T>;
  }
}
Enumerable.prototype.cast = function <T, TReturn>(
  this: Enumerable<T>,
): Enumerable<TReturn> {
  return this as unknown as Enumerable<TReturn>;
};
Enumerable.prototype.map = function <T, TReturn>(
  this: Enumerable<T>,
  selector: (item: T) => TReturn,
): Enumerable<TReturn> {
  return new SelectEnumerable(this, selector);
};
Enumerable.prototype.flatMap = function <T, TReturn>(
  this: Enumerable<T>,
  selector: (item: T) => TReturn[] | Enumerable<TReturn>,
): Enumerable<TReturn> {
  return new SelectManyEnumerable(this, selector);
};
Enumerable.prototype.filter = function <T>(
  this: Enumerable<T>,
  predicate: (item: T) => boolean,
): Enumerable<T> {
  return new WhereEnumerable(this, predicate);
};
Enumerable.prototype.orderBy = function <T>(
  this: Enumerable<T>,
  ...selectors: Array<IOrderDefinition<T>>
): Enumerable<T> {
  return new OrderEnumerable(this, ...selectors);
};
Enumerable.prototype.skip = function <T>(
  this: Enumerable<T>,
  skip: number,
): Enumerable<T> {
  return new SkipEnumerable(this, skip);
};
Enumerable.prototype.take = function <T>(
  this: Enumerable<T>,
  take: number,
): Enumerable<T> {
  return new TakeEnumerable(this, take);
};
Enumerable.prototype.slice = function <T>(
  this: Enumerable<T>,
  skip: number,
  take: number,
): Enumerable<T> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  let result: Enumerable<T> = this;
  if (typeof skip === "number" && skip > 0) {
    result = result.skip(skip);
  }
  if (typeof take === "number") {
    result = result.take(take);
  }
  return result;
};
Enumerable.prototype.groupBy = function <T, K>(
  this: Enumerable<T>,
  keySelector: (item: T) => K,
): GroupByEnumerable<K, T> {
  return new GroupByEnumerable(this, keySelector);
};
Enumerable.prototype.distinct = function <T>(
  this: Enumerable<T>,
  selector?: (item: T) => unknown,
): Enumerable<T> {
  return new DistinctEnumerable(this, selector);
};
Enumerable.prototype.innerJoin = function <T, T2, TResult>(
  this: Enumerable<T>,
  array2: IEnumerable<T2>,
  relation: (item: T, item2: T2) => boolean,
  resultSelector: (item1: T, item2: T2) => TResult = defaultResultFn,
): Enumerable<TResult> {
  return new InnerJoinEnumerable(
    this,
    Enumerable.from(array2),
    relation,
    resultSelector,
  );
};
Enumerable.prototype.leftJoin = function <T, T2, TResult>(
  this: Enumerable<T>,
  array2: IEnumerable<T2>,
  relation: (item: T, item2: T2) => boolean,
  resultSelector: (item1: T, item2: T2 | null) => TResult = defaultResultFn,
): Enumerable<TResult> {
  return new LeftJoinEnumerable(
    this,
    Enumerable.from(array2),
    relation,
    resultSelector,
  );
};
Enumerable.prototype.rightJoin = function <T, T2, TResult>(
  this: Enumerable<T>,
  array2: IEnumerable<T2>,
  relation: (item: T, item2: T2) => boolean,
  resultSelector: (item1: T | null, item2: T2) => TResult = defaultResultFn,
): Enumerable<TResult> {
  return new RightJoinEnumerable(
    this,
    Enumerable.from(array2),
    relation,
    resultSelector,
  );
};
Enumerable.prototype.fullJoin = function <T, T2, TResult>(
  this: Enumerable<T>,
  array2: IEnumerable<T2>,
  relation: (item: T, item2: T2) => boolean,
  resultSelector: (
    item1: T | null,
    item2: T2 | null,
  ) => TResult = defaultResultFn,
): Enumerable<TResult> {
  return new FullJoinEnumerable(
    this,
    Enumerable.from(array2),
    relation,
    resultSelector,
  );
};
Enumerable.prototype.groupJoin = function <T, T2, TResult>(
  this: Enumerable<T>,
  array2: IEnumerable<T2>,
  relation: (item: T, item2: T2) => boolean,
  resultSelector: (item1: T, item2: T2[]) => TResult,
): Enumerable<TResult> {
  return new GroupJoinEnumerable(
    this,
    Enumerable.from(array2),
    relation,
    resultSelector,
  );
};
Enumerable.prototype.crossJoin = function <T, T2, TResult>(
  this: Enumerable<T>,
  array2: IEnumerable<T2>,
  resultSelector: (
    item1: T | null,
    item2: T2 | null,
  ) => TResult = defaultResultFn,
): Enumerable<TResult> {
  return new CrossJoinEnumerable(this, Enumerable.from(array2), resultSelector);
};
Enumerable.prototype.union = function <T>(
  this: Enumerable<T>,
  array2: IEnumerable<T>,
): Enumerable<T> {
  return new UnionEnumerable(this, Enumerable.from(array2));
};
Enumerable.prototype.concat = function <T>(
  this: Enumerable<T>,
  ...items: Iterable<T>[]
): Enumerable<T> {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  let result: Enumerable<T> = this;
  for (const item of items) {
    result = new UnionEnumerable(result, Enumerable.from(item), true);
  }

  return result;
};
Enumerable.prototype.intersect = function <T>(
  this: Enumerable<T>,
  array2: IEnumerable<T>,
): Enumerable<T> {
  return new IntersectEnumerable(this, Enumerable.from(array2));
};
Enumerable.prototype.except = function <T>(
  this: Enumerable<T>,
  array2: IEnumerable<T>,
): Enumerable<T> {
  return new ExceptEnumerable(this, Enumerable.from(array2));
};
Enumerable.prototype.pivot = function <
  T,
  TD extends { [key: string]: (item: T) => unknown },
  TM extends { [key: string]: (item: T[]) => unknown },
>(
  this: Enumerable<T>,
  dimensions: TD,
  metrics: TM,
): Enumerable<Pivot<T, TD, TM>> {
  return this.groupBy((o) => {
    const dimensionKey = {} as Pivot<T, TD, TM>;
    for (const key in dimensions) {
      if (dimensions[key] instanceof Function) {
        dimensionKey[key] = dimensions[key](o) as Pivot<T, TD, TM>[Extract<
          keyof TD,
          string
        >];
      }
    }
    return dimensionKey;
  }).map((o) => {
    for (const key in metrics) {
      if (o.key) {
        o.key[key] = metrics[key](o.toArray()) as Pivot<T, TD, TM>[Extract<
          keyof TM,
          string
        >];
      }
    }
    return o.key;
  });
};

export { Enumerable };
const isNotNull = <T>(value: T | null | undefined): value is T => value != null;
export const keyComparer = <T = unknown>(a: T, b: T) => {
  let result = a === b;
  if (
    !result &&
    isNotNull(a) &&
    isNotNull(b) &&
    a instanceof Object &&
    b instanceof Object
  ) {
    const aKeys = Object.keys(a) as Array<keyof T>;
    const bKeys = Object.keys(b) as Array<keyof T>;
    result = aKeys.length === bKeys.length;
    if (result) {
      result = Enumerable.from(aKeys).every(
        (o) => Object.prototype.hasOwnProperty.call(b, o) && b[o] === a[o],
      );
    }
  }
  return result;
};
export const defaultResultFn = <T = unknown, T2 = unknown, R = unknown>(
  item1: T | null,
  item2: T2 | null,
): R => {
  const result = {} as Partial<Record<string, unknown>>;
  if (item2) {
    for (const prop in item2) {
      result[prop] = item2[prop];
    }
  }
  if (item1) {
    for (const prop in item1) {
      result[prop] = item1[prop];
    }
  }
  return result as R;
};
