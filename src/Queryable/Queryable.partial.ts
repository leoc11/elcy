import { GenericType, ValueType, IObjectType } from "../Common/Type";
import { Queryable } from "../Queryable/Queryable";
import { DistinctQueryable } from "./DistinctQueryable";
import { ExceptQueryable } from "./ExceptQueryable";
import { FullJoinQueryable } from "./FullJoinQueryable";
import { GroupByQueryable } from "./GroupByQueryable";
import { IncludeQueryable } from "./IncludeQueryable";
import { InnerJoinQueryable } from "./InnerJoinQueryable";
import { IntersectQueryable } from "./IntersectQueryable";
import { LeftJoinQueryable } from "./LeftJoinQueryable";
import { OrderQueryable } from "./OrderQueryable";
import { PivotQueryable } from "./PivotQueryable";
import { RightJoinQueryable } from "./RightJoinQueryable";
import { SelectManyQueryable } from "./SelectManyQueryable";
import { SelectQueryable } from "./SelectQueryable";
import { SkipQueryable } from "./SkipQueryable";
import { TakeQueryable } from "./TakeQueryable";
import { UnionQueryable } from "./UnionQueryable";
import { WhereQueryable } from "./WhereQueryable";
import { IOrderQueryDefinition } from "./Interface/IOrderQueryDefinition";
import { ParameterQueryable } from "./ParameterQueryable";
import { ProjectQueryable } from "./ProjectQueryable";
import { GroupJoinQueryable } from "./GroupJoinQueryable";
import { OptionQueryable } from "./OptionQueryable";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { IQueryOption } from "../Query/IQueryOption";

declare module "./Queryable" {
    interface Queryable<T> {
        parameter(params: { [key: string]: any }): Queryable<T>;
        option(option: IQueryOption): Queryable<T>;
        select<TReturn>(type: IObjectType<TReturn>, selector: ((item: T) => { [key in keyof TReturn]?: TReturn[key] })): Queryable<TReturn>;
        select<TReturn>(selector: ((item: T) => TReturn)): Queryable<TReturn>;
        select<TReturn>(typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)): Queryable<TReturn>;
        selectMany<TReturn>(selector: (item: T) => Iterable<TReturn>): Queryable<TReturn>;
        where(predicate: (item: T) => boolean): Queryable<T>;
        orderBy(...selectors: IOrderQueryDefinition<T>[]): Queryable<T>;
        skip(skip: number): Queryable<T>;
        take(take: number): Queryable<T>;
        groupBy<K>(keySelector: (item: T) => K): Queryable<GroupedEnumerable<K, T>>;
        distinct(): Queryable<T>;
        project(...includes: Array<(item: T) => ValueType>): Queryable<T>;
        include(...includes: Array<(item: T) => any>): Queryable<T>;
        union(array2: Queryable<T>, isUnionAll?: boolean): Queryable<T>;
        intersect(array2: Queryable<T>): Queryable<T>;
        except(array2: Queryable<T>): Queryable<T>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2[]) => TResult): Queryable<TResult>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2) => TResult): Queryable<TResult>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2 | null) => TResult): Queryable<TResult>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T | null, item2: T2) => TResult): Queryable<TResult>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T | null, item2: T2 | null) => TResult): Queryable<TResult>;
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }, TResult extends { [key in (keyof TD & keyof TM)]: ValueType }>(dimensions: TD, metrics: TM): Queryable<TResult>;
    }
}

Queryable.prototype.select = function <T, TReturn>(this: Queryable<T>, typeOrSelector: IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)): Queryable<TReturn> {
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
Queryable.prototype.where = function <T>(this: Queryable<T>, predicate: (item: T) => boolean): Queryable<T> {
    return new WhereQueryable(this, predicate);
};
Queryable.prototype.orderBy = function <T>(this: Queryable<T>, ...selectors: IOrderQueryDefinition<T>[]): Queryable<T> {
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
Queryable.prototype.union = function <T>(this: Queryable<T>, array2: Queryable<T>, isUnionAll: boolean = false): Queryable<T> {
    return new UnionQueryable(this, array2, isUnionAll);
};
Queryable.prototype.intersect = function <T>(this: Queryable<T>, array2: Queryable<T>): Queryable<T> {
    return new IntersectQueryable(this, array2);
};
Queryable.prototype.except = function <T>(this: Queryable<T>, array2: Queryable<T>): Queryable<T> {
    return new ExceptQueryable(this, array2);
};
Queryable.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }, TResult extends { [key in (keyof TD & keyof TM)]: ValueType }>(this: Queryable<T>, dimensions: TD, metrics: TM): Queryable<TResult> {
    return new PivotQueryable(this, dimensions, metrics);
};
Queryable.prototype.include = function <T>(this: Queryable<T>, ...includes: Array<(item: T) => any>): Queryable<T> {
    return new IncludeQueryable(this, includes);
};
Queryable.prototype.project = function <T>(this: Queryable<T>, ...includes: Array<(item: T) => ValueType>): Queryable<T> {
    return new ProjectQueryable(this, includes);
};
