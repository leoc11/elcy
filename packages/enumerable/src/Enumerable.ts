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
import { UnionEnumerable } from "./UnionEnumerable";
import { WhereEnumerable } from "./WhereEnumerable";
import { ConcatEnumerable } from "./ConcatEnumerable";
import { SliceEnumerable } from "./SliceEnumerable";

declare module "./Enumerable" {
  interface Enumerable<T> {
    [Symbol.iterator](): IterableIterator<T>;

    cast<TReturn>(): Enumerable<TReturn>;
    crossJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      resultSelector: (item1: T, item2: T2) => TResult,
    ): Enumerable<TResult>;
    distinct(selector?: (item: T) => unknown): Enumerable<T>;
    fullJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T | null, item2: T2 | null) => TResult,
    ): Enumerable<TResult>;
    groupBy<K>(
      keySelector: (item: T) => K,
      keyHash?: (item: K) => unknown,
    ): GroupByEnumerable<K, T>;
    groupJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T, item2: Enumerable<T2>) => TResult,
    ): Enumerable<TResult>;
    innerJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T, item2: T2) => TResult,
    ): Enumerable<TResult>;
    leftJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T, item2: T2 | null) => TResult,
    ): Enumerable<TResult>;
    orderBy(...selectors: Array<IOrderDefinition<T>>): Enumerable<T>;
    rightJoin<T2, TResult>(
      array2: IEnumerable<T2>,
      relation: (item: T, item2: T2) => boolean,
      resultSelector: (item1: T | null, item2: T2) => TResult,
    ): Enumerable<TResult>;
    map<TReturn>(selector: (item: T) => TReturn): Enumerable<TReturn>;
    flatMap<TReturn>(
      selector: (item: T) => Iterable<TReturn>,
    ): Enumerable<TReturn>;
    slice(start: number, end?: number): Enumerable<T>;
    union(...items: [Iterable<T>, ...Iterable<T>[]]): Enumerable<T>;
    intersect(...items: [Iterable<T>, ...Iterable<T>[]]): Enumerable<T>;
    except(...items: [Iterable<T>, ...Iterable<T>[]]): Enumerable<T>;
    concat(...items: [Iterable<T>, ...Iterable<T>[]]): Enumerable<T>;
    filter(predicate: (item: T) => boolean): Enumerable<T>;

    join: T extends string ? (separator?: string) => string : never;
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
  selector: (item: T) => Iterable<TReturn>,
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
Enumerable.prototype.slice = function <T>(
  this: Enumerable<T>,
  start: number,
  end?: number,
): Enumerable<T> {
  return new SliceEnumerable(this, start, end);
};
Enumerable.prototype.groupBy = function <T, K>(
  this: Enumerable<T>,
  keySelector: (item: T) => K,
  keyHash?: (item: K) => unknown,
): GroupByEnumerable<K, T> {
  return new GroupByEnumerable(this, keySelector, keyHash);
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
  resultSelector: (item1: T, item2: T2) => TResult,
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
  resultSelector: (item1: T, item2: T2 | null) => TResult,
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
  resultSelector: (item1: T | null, item2: T2) => TResult,
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
  resultSelector: (item1: T | null, item2: T2 | null) => TResult,
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
  resultSelector: (item1: T, item2: Enumerable<T2>) => TResult,
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
  resultSelector: (item1: T | null, item2: T2 | null) => TResult,
): Enumerable<TResult> {
  return new CrossJoinEnumerable(this, Enumerable.from(array2), resultSelector);
};
Enumerable.prototype.union = function <T>(
  this: Enumerable<T>,
  ...items: [Iterable<T>, ...Iterable<T>[]]
): Enumerable<T> {
  return new UnionEnumerable(
    this,
    ...(items.map((o) => Enumerable.from(o)) as [
      Enumerable<T>,
      ...Enumerable<T>[],
    ]),
  );
};
Enumerable.prototype.concat = function <T>(
  this: Enumerable<T>,
  ...items: [Iterable<T>, ...Iterable<T>[]]
): Enumerable<T> {
  return new ConcatEnumerable(
    this,
    ...(items.map((o) => Enumerable.from(o)) as [
      Enumerable<T>,
      ...Enumerable<T>[],
    ]),
  );
};
Enumerable.prototype.intersect = function <T>(
  this: Enumerable<T>,
  ...items: [Iterable<T>, ...Iterable<T>[]]
): Enumerable<T> {
  return new IntersectEnumerable(
    this,
    ...(items.map((o) => Enumerable.from(o)) as [
      Enumerable<T>,
      ...Enumerable<T>[],
    ]),
  );
};
Enumerable.prototype.except = function <T>(
  this: Enumerable<T>,
  ...items: [Iterable<T>, ...Iterable<T>[]]
): Enumerable<T> {
  return new ExceptEnumerable(
    this,
    ...(items.map((o) => Enumerable.from(o)) as [
      Enumerable<T>,
      ...Enumerable<T>[],
    ]),
  );
};
Enumerable.prototype.join = function <T>(
  this: Enumerable<T>,
  separator: string = ",",
): string {
  let str: string = "";
  for (const item of this) {
    str += `${str ? separator : ""}${item}`;
  }
  return str;
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
