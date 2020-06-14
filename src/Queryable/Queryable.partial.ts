import { GenericType, IObjectType, Pivot, PredicateSelector, ResultSelector, ValueType } from "../Common/Type";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { IQueryOption } from "../Query/IQueryOption";
import { Queryable } from "../Queryable/Queryable";
import { CrossJoinQueryable } from "./CrossJoinQueryable";
import { DistinctQueryable } from "./DistinctQueryable";
import { ExceptQueryable } from "./ExceptQueryable";
import { FullJoinQueryable } from "./FullJoinQueryable";
import { GroupByQueryable } from "./GroupByQueryable";
import { GroupJoinQueryable } from "./GroupJoinQueryable";
import { IncludeQueryable } from "./IncludeQueryable";
import { InnerJoinQueryable } from "./InnerJoinQueryable";
import { IOrderQueryDefinition } from "./Interface/IOrderQueryDefinition";
import { IntersectQueryable } from "./IntersectQueryable";
import { LeftJoinQueryable } from "./LeftJoinQueryable";
import { OptionQueryable } from "./OptionQueryable";
import { OrderQueryable } from "./OrderQueryable";
import { ParameterQueryable } from "./ParameterQueryable";
import { PivotQueryable } from "./PivotQueryable";
import { ProjectQueryable } from "./ProjectQueryable";
import { RightJoinQueryable } from "./RightJoinQueryable";
import { SelectManyQueryable } from "./SelectManyQueryable";
import { SelectQueryable } from "./SelectQueryable";
import { SkipQueryable } from "./SkipQueryable";
import { TakeQueryable } from "./TakeQueryable";
import { UnionQueryable } from "./UnionQueryable";
import { WhereQueryable } from "./WhereQueryable";

declare module "./Queryable" {
    interface Queryable<T> {
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: (item1: T | null, item2: T2 | null) => TResult): Queryable<TResult>;
        distinct(): Queryable<T>;
        except(array2: Queryable<T>): Queryable<T>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T | null, item2: T2 | null) => TResult): Queryable<TResult>;
        groupBy<K>(keySelector: (item: T) => K): Queryable<GroupedEnumerable<K, T>>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2[]) => TResult): Queryable<TResult>;
        include(...includes: Array<(item: T) => any>): Queryable<T>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2) => TResult): Queryable<TResult>;
        intersect(array2: Queryable<T>): Queryable<T>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2 | null) => TResult): Queryable<TResult>;
        option(option: IQueryOption): Queryable<T>;
        orderBy(...selectors: Array<IOrderQueryDefinition<T>>): Queryable<T>;
        parameter(params: { [key: string]: any }): Queryable<T>;
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(dimensions: TD, metrics: TM): Queryable<Pivot<T, TD, TM>>;
        project(...includes: Array<(item: T) => ValueType>): Queryable<T>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T | null, item2: T2) => TResult): Queryable<TResult>;
        select<TReturn>(type: IObjectType<TReturn>, selector: ResultSelector<T, TReturn>): Queryable<TReturn>;
        select<TReturn>(selector: ResultSelector<T, TReturn>): Queryable<TReturn>;
        select<TReturn>(typeOrSelector: IObjectType<TReturn> | ResultSelector<T, TReturn>, selector?: ResultSelector<T, TReturn>): Queryable<TReturn>;
        selectMany<TReturn>(selector: (item: T) => Iterable<TReturn>): Queryable<TReturn>;
        skip(skip: number): Queryable<T>;
        take(take: number): Queryable<T>;
        union(array2: Queryable<T>, isUnionAll?: boolean): Queryable<T>;
        where(predicate: PredicateSelector<T>): Queryable<T>;
    }
}

Queryable.prototype.select = function <T, TReturn>(this: Queryable<T>, typeOrSelector: IObjectType<TReturn> | ResultSelector<T, TReturn>, selector?: ResultSelector<T, TReturn>): Queryable<TReturn> {
    let type: IObjectType<TReturn>;
    if (!selector) {
        selector = typeOrSelector as any;
    }
    else {
        type = typeOrSelector as any;
    }
    return new SelectQueryable<T, TReturn>(this, selector, type);
};
Queryable.prototype.parameter = function <T>(params: { [key: string]: any }): Queryable<T> {
    return new ParameterQueryable(this, params);
};
Queryable.prototype.option = function <T>(option: IQueryOption): Queryable<T> {
    return new OptionQueryable(this, option);
};
Queryable.prototype.selectMany = function <T, TReturn>(this: Queryable<T>, selector: (item: T) => TReturn[], type?: GenericType<TReturn>): Queryable<TReturn> {
    return new SelectManyQueryable<T, TReturn>(this, selector, type);
};
Queryable.prototype.where = function <T>(this: Queryable<T>, predicate: PredicateSelector<T>): Queryable<T> {
    return new WhereQueryable(this, predicate);
};
Queryable.prototype.orderBy = function <T>(this: Queryable<T>, ...selectors: Array<IOrderQueryDefinition<T>>): Queryable<T> {
    return new OrderQueryable(this, ...selectors);
};
Queryable.prototype.skip = function <T>(this: Queryable<T>, skip: number): Queryable<T> {
    return new SkipQueryable(this, skip);
};
Queryable.prototype.take = function <T>(this: Queryable<T>, take: number): Queryable<T> {
    return new TakeQueryable(this, take);
};
Queryable.prototype.groupBy = function <T, K>(this: Queryable<T>, keySelector: (item: T) => K): Queryable<GroupedEnumerable<K, T>> {
    return new GroupByQueryable(this, keySelector);
};
Queryable.prototype.distinct = function <T>(this: Queryable<T>): Queryable<T> {
    return new DistinctQueryable(this);
};
Queryable.prototype.groupJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2[]) => TResult): Queryable<TResult> {
    return new GroupJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.innerJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2) => TResult): Queryable<TResult> {
    return new InnerJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.leftJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2 | null) => TResult): Queryable<TResult> {
    return new LeftJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.rightJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T | null, item2: T2) => TResult): Queryable<TResult> {
    return new RightJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.fullJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T | null, item2: T2 | null) => TResult): Queryable<TResult> {
    return new FullJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.crossJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, resultSelector?: (item1: T | null, item2: T2 | null) => TResult): Queryable<TResult> {
    return new CrossJoinQueryable(this, array2, resultSelector);
};
Queryable.prototype.union = function <T>(this: Queryable<T>, array2: Queryable<T>, isUnionAll: boolean = false): Queryable<T> {
    return new UnionQueryable(this, array2, isUnionAll);
};
Queryable.prototype.intersect = function <T>(this: Queryable<T>, array2: Queryable<T>): Queryable<T> {
    return new IntersectQueryable(this, array2);
};
Queryable.prototype.except = function <T>(this: Queryable<T>, array2: Queryable<T>): Queryable<T> {
    return new ExceptQueryable(this, array2);
};
Queryable.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(this: Queryable<T>, dimensions: TD, metrics: TM): Queryable<Pivot<T, TD, TM>> {
    return new PivotQueryable(this, dimensions, metrics);
};
Queryable.prototype.include = function <T>(this: Queryable<T>, ...includes: Array<(item: T) => any>): Queryable<T> {
    return new IncludeQueryable(this, includes);
};
Queryable.prototype.project = function <T>(this: Queryable<T>, ...includes: Array<(item: T) => ValueType>): Queryable<T> {
    return new ProjectQueryable(this, includes);
};
