import { GenericType, IObjectType, Pivot, ValueType } from "../Common/Type";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { IQueryOption } from "../Query/IQueryOption";
import { Queryable } from "./Queryable.internal";
import { CrossJoinQueryable } from "./CrossJoinQueryable";
import { DistinctQueryable } from "./DistinctQueryable";
import { ExceptQueryable } from "./ExceptQueryable";
import { FullJoinQueryable } from "./FullJoinQueryable";
import { GroupByQueryable } from "./GroupByQueryable";
import { GroupJoinQueryable } from "./GroupJoinQueryable";
import { IncludeQueryable } from "./IncludeQueryable";
import { InnerJoinQueryable } from "./InnerJoinQueryable";
import { IntersectQueryable } from "./IntersectQueryable";
import { LeftJoinQueryable } from "./LeftJoinQueryable";
import { OptionQueryable } from "./OptionQueryable";
import { OrderQueryable } from "./OrderQueryable";
import { ParameterQueryable } from "./ParameterQueryable";
import { PivotQueryable, TExpObject } from "./PivotQueryable";
import { ProjectQueryable } from "./ProjectQueryable";
import { RightJoinQueryable } from "./RightJoinQueryable";
import { SelectManyQueryable } from "./SelectManyQueryable";
import { SelectQueryable } from "./SelectQueryable";
import { SkipQueryable } from "./SkipQueryable";
import { TakeQueryable } from "./TakeQueryable";
import { UnionQueryable } from "./UnionQueryable";
import { WhereQueryable } from "./WhereQueryable";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IOrderDefinition } from "../Enumerable/Interface/IOrderDefinition";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { OrderDirection } from "../Common/StringType";

declare module "./Queryable" {
    interface Queryable<T> {
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, null | T | T2>): Queryable<TResult>;
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: (item1: T | null, item2: T2 | null) => TResult): Queryable<TResult>;
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, null | T | T2> | ((item1: T | null, item2: T2 | null) => TResult)): Queryable<TResult>;
        
        distinct(): Queryable<T>;
        except(array2: Queryable<T>): Queryable<T>;
        
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, null | T | T2>): Queryable<TResult>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T | null, item2: T2 | null) => TResult): Queryable<TResult>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, null | T | T2> | ((item1: T | null, item2: T2 | null) => TResult)): Queryable<TResult>;
        
        groupBy<K>(keySelector: (item: T) => K): Queryable<GroupedEnumerable<K, T>>;
        groupBy<K>(keySelector: FunctionExpression<K, T>): Queryable<GroupedEnumerable<K, T>>;
        groupBy<K>(keySelector: FunctionExpression<K, T> | ((item: T) => K)): Queryable<GroupedEnumerable<K, T>>;
        
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2[]) => TResult): Queryable<TResult>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, T | T2[]>): Queryable<TResult>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, T | T2[]> | ((item1: T, item2: T2[]) => TResult)): Queryable<TResult>;
        
        include(...includes: Array<FunctionExpression<unknown, T>>): Queryable<T>;
        include(...includes: Array<(item: T) => unknown>): Queryable<T>;
        include(...includes: Array<FunctionExpression<unknown, T> | ((item: T) => unknown)>): Queryable<T>;
        
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, T | T2>): Queryable<TResult>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2) => TResult): Queryable<TResult>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, T | T2> | ((item1: T, item2: T2) => TResult)): Queryable<TResult>;
        
        intersect(array2: Queryable<T>): Queryable<T>;
        
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, T | T2 | null>): Queryable<TResult>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T, item2: T2 | null) => TResult): Queryable<TResult>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2 | null) => boolean), resultSelector?: FunctionExpression<TResult, T | T2> | ((item1: T, item2: T2 | null) => TResult)): Queryable<TResult>;
        
        option(option: IQueryOption): Queryable<T>;
        
        orderBy(...selectors: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>>): Queryable<T>;
        orderBy(...selectors: Array<IOrderDefinition<T>>): Queryable<T>;
        
        parameter(params: { [key: string]: unknown }): Queryable<T>;
        
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(dimensions: TD, metrics: TM): Queryable<Pivot<T, TD, TM>>;
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(dimensions: TExpObject<TD>, metrics: TExpObject<TM>): Queryable<Pivot<T, TD, TM>>;
        pivot<TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(dimensions: TD | TExpObject<TD>, metrics: TM | TExpObject<TM>): Queryable<Pivot<T, TD, TM>>;
        
        project(...includes: Array<(item: T) => ValueType>): Queryable<T>;
        project(...includes: FunctionExpression<ValueType, T>[]): Queryable<T>;
        project(...includes: FunctionExpression<ValueType, T>[] | Array<(item: T) => ValueType>): Queryable<T>;
        
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, T | null | T2>): Queryable<TResult>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: T, item2: T2) => boolean, resultSelector?: (item1: T | null, item2: T2) => TResult): Queryable<TResult>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, T | null | T2> | ((item1: T | null, item2: T2) => TResult)): Queryable<TResult>;
        
        select<TReturn>(selector: FunctionExpression<TReturn, T> | ((item: T) => TReturn)): Queryable<TReturn>;
        select<TReturn>(type: IObjectType<TReturn>, selector: FunctionExpression<TReturn, T> | ((item: T) => { [key in keyof TReturn]?: TReturn[key] })): Queryable<TReturn>;
        select<TReturn>(typeOrSelector: FunctionExpression<TReturn, T> | IObjectType<TReturn> | ((item: T) => TReturn), selector?: ((item: T) => TReturn)): Queryable<TReturn>;
        
        selectMany<TReturn>(selector: (item: T) => Iterable<TReturn>, type?: GenericType<TReturn>): Queryable<TReturn>;
        selectMany<TReturn>(selector: FunctionExpression<Iterable<TReturn>, T>, type?: GenericType<TReturn>): Queryable<TReturn>;
        selectMany<TReturn>(selector: FunctionExpression<Iterable<TReturn>, T> | ((item: T) => Iterable<TReturn>), type?: GenericType<TReturn>): Queryable<TReturn>;
        
        skip(skip: number): Queryable<T>;
        take(take: number): Queryable<T>;
        union(array2: Queryable<T>, isUnionAll?: boolean): Queryable<T>;
        
        where(predicate: (item: T) => boolean): Queryable<T>;
        where(predicate: FunctionExpression<boolean, T>): Queryable<T>;
        where(predicate: FunctionExpression<boolean, T> | ((item: T) => boolean)): Queryable<T>;
    }
}

Queryable.prototype.select = function <T, TReturn>(this: Queryable<T>, typeOrSelector: IObjectType<TReturn> | FunctionExpression<TReturn, T> | ((item: T) => TReturn), selector?: FunctionExpression<TReturn, T> | ((item: T) => TReturn)): Queryable<TReturn> {
    let type: IObjectType<TReturn>;
    if (!selector) {
        selector = typeOrSelector as FunctionExpression<TReturn, T> | ((item: T) => TReturn);
    }
    else {
        type = typeOrSelector as IObjectType<TReturn>;
    }
    return new SelectQueryable(this, selector, type);
};
Queryable.prototype.parameter = function <T>(params: { [key: string]: unknown }): Queryable<T> {
    return new ParameterQueryable(this, params);
};
Queryable.prototype.option = function <T>(option: IQueryOption): Queryable<T> {
    return new OptionQueryable(this, option);
};
Queryable.prototype.selectMany = function <T, TReturn>(this: Queryable<T>, selector: FunctionExpression<Iterable<TReturn>, T> | ((item: T) => Iterable<TReturn>), type?: GenericType<TReturn>): Queryable<TReturn> {
    return new SelectManyQueryable(this, selector, type);
};
Queryable.prototype.where = function <T>(this: Queryable<T>, predicate: FunctionExpression<boolean, T> | ((item: T) => boolean)): Queryable<T> {
    return new WhereQueryable(this, predicate);
};
Queryable.prototype.orderBy = function <T>(this: Queryable<T>, ...selectors: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>> | Array<IOrderDefinition<T>>): Queryable<T> {
    return new OrderQueryable(this, ...selectors);
};
Queryable.prototype.skip = function <T>(this: Queryable<T>, skip: number): Queryable<T> {
    return new SkipQueryable(this, skip);
};
Queryable.prototype.take = function <T>(this: Queryable<T>, take: number): Queryable<T> {
    return new TakeQueryable(this, take);
};
Queryable.prototype.groupBy = function <T, K>(this: Queryable<T>, keySelector: FunctionExpression<K, T> | ((item: T) => K)): Queryable<GroupedEnumerable<K, T>> {
    return new GroupByQueryable(this, keySelector);
};
Queryable.prototype.distinct = function <T>(this: Queryable<T>): Queryable<T> {
    return new DistinctQueryable(this);
};
Queryable.prototype.groupJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, T | T2[]> | ((item1: T, item2: T2[]) => TResult)): Queryable<TResult> {
    return new GroupJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.innerJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, T | T2> | ((item1: T, item2: T2) => TResult)): Queryable<TResult> {
    return new InnerJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.leftJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, T | T2 | null> | ((item1: T, item2: T2 | null) => TResult)): Queryable<TResult> {
    return new LeftJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.rightJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, T | null | T2> | ((item1: T | null, item2: T2) => TResult)): Queryable<TResult> {
    return new RightJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.fullJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, null | T | T2> | ((item1: T | null, item2: T2 | null) => TResult)): Queryable<TResult> {
    return new FullJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.crossJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, null | T | T2> | ((item1: T | null, item2: T2 | null) => TResult)): Queryable<TResult> {
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
Queryable.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => ValueType }, TM extends { [key: string]: (item: T[]) => ValueType }>(this: Queryable<T>, dimensions: TD | TExpObject<TD>, metrics: TM | TExpObject<TM>): Queryable<Pivot<T, TD, TM>> {
    return new PivotQueryable(this, dimensions, metrics);
};
Queryable.prototype.include = function <T>(this: Queryable<T>, ...includes: FunctionExpression<unknown, T>[] | Array<(item: T) => unknown>): Queryable<T> {
    return new IncludeQueryable(this, includes);
};
Queryable.prototype.project = function <T>(this: Queryable<T>, ...includes: FunctionExpression<ValueType, T>[] | Array<(item: T) => ValueType>): Queryable<T> {
    return new ProjectQueryable(this, includes);
};

export { Queryable };