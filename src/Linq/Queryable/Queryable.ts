import { genericType, orderDirection } from "../../Common/Type";
import { Enumerable } from "../Enumerable";
import { QueryBuilder } from "../QueryBuilder";
import { DistinctQueryable } from "./DistinctQueryable";
import { ExceptQueryable } from "./ExceptQueryable";
import { FullJoinQueryable } from "./FullJoinQueryable";
import { GroupByQueryable } from "./GroupbyQueryable";
import { IncludeQueryable } from "./IncludeQueryable";
import { InnerJoinQueryable } from "./InnerJoinQueryable";
import { IntersectQueryable } from "./IntersectQueryable";
import { LeftJoinQueryable } from "./LeftJoinQueryable";
import { OrderQueryable } from "./OrderQueryable";
import { PivotQueryable } from "./PivotQueryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { RightJoinQueryable } from "./RightJoinQueryable";
import { SelectManyQueryable } from "./SelectManyQueryable";
import { SelectQueryable } from "./SelectQueryable";
import { SkipQueryable } from "./SkipQueryable";
import { TakeQueryable } from "./TakeQueryable";
import { UnionQueryable } from "./UnionQueryable";
import { WhereQueryable } from "./WhereQueryable";

export class Queryable<T = any> extends Enumerable<T> {
    public expression: IQueryExpression<T>;
    public parent: Queryable;
    constructor(public type: genericType<T>, public queryBuilder: QueryBuilder) {
        super();
    }
    public select<TReturn>(selector: ((item: T) => TReturn), type?: genericType<TReturn>): Queryable<TReturn> {
        return new SelectQueryable<T, TReturn>(this, selector, type);
    }
    public selectMany<TReturn>(selector: (item: T) => TReturn[], type?: genericType<TReturn>): Queryable<TReturn> {
        return new SelectManyQueryable<T, TReturn>(this, selector, type);
    }
    public where(predicate: (item: T) => boolean): Queryable<T> {
        return new WhereQueryable(this, predicate);
    }
    public orderBy(selector: (item: T) => any, direction: orderDirection): Queryable<T> {
        return new OrderQueryable(this, selector, direction);
    }
    public skip(skip: number): Queryable<T> {
        return new SkipQueryable(this, skip);
    }
    public take(take: number): Queryable<T> {
        return new TakeQueryable(this, take);
    }
    // public groupBy<K>(keySelector: (item: T) => K): GroupByQueryable<T, K> {
    //     return new GroupByQueryable(this, keySelector);
    // }
    public distinct(selector?: (item: T) => any): Queryable<T> {
        return new DistinctQueryable(this, selector);
    }
    public innerJoin<T2, TKey, TResult>(array2: Queryable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector?: (item1: T, item2: T2) => TResult): Queryable<TResult> {
        return new InnerJoinQueryable(this, array2, keySelector1, keySelector2, resultSelector);
    }
    public leftJoin<T2, TKey, TResult>(array2: Queryable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector?: (item1: T, item2: T2 | null) => TResult): Queryable<TResult> {
        return new LeftJoinQueryable(this, array2, keySelector1, keySelector2, resultSelector);
    }
    public rightJoin<T2, TKey, TResult>(array2: Queryable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector?: (item1: T | null, item2: T2) => TResult): Queryable<TResult> {
        return new RightJoinQueryable(this, array2, keySelector1, keySelector2, resultSelector);
    }
    public fullJoin<T2, TKey, TResult>(array2: Queryable<T2>, keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector?: (item1: T | null, item2: T2 | null) => TResult): Queryable<TResult> {
        return new FullJoinQueryable(this, array2, keySelector1, keySelector2, resultSelector);
    }
    public union(array2: Queryable<T>, isUnionAll: boolean = false): Queryable<T> {
        return new UnionQueryable(this, array2, isUnionAll);
    }
    public intersect(array2: Queryable<T>): Queryable<T> {
        return new IntersectQueryable(this, array2);
    }
    public except(array2: Queryable<T>): Queryable<T> {
        return new ExceptQueryable(this, array2);
    }
    public pivot<TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }>(dimensions: TD, metrics: TM): Queryable<TResult> {
        return new PivotQueryable(this, dimensions, metrics);
    }
    public include(...includes: Array<(item: T) => any>): Queryable<T> {
        return new IncludeQueryable(this, includes);
    }
}
