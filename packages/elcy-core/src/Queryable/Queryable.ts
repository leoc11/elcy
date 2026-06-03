import { GenericType, IObjectType, Pivot, PivotD, PivotM, ValueType } from "../Common/Type";
import { Enumerable, IEnumerable } from "@elcy/enumerable";
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
import { PivotQueryable } from "./PivotQueryable";
import { RightJoinQueryable } from "./RightJoinQueryable";
import { SelectManyQueryable } from "./SelectManyQueryable";
import { SelectQueryable } from "./SelectQueryable";
import { UnionQueryable } from "./UnionQueryable";
import { WhereQueryable } from "./WhereQueryable";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IOrderDefinition } from "@elcy/enumerable";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { OrderDirection } from "../Common/StringType";
import { Querify, Unquerify } from "./Interface/Querify";
import { ConcatQueryable } from "./ConcatQueryable";
import { SliceQueryable } from "./SliceQueryable";
import { IGroupArray } from "src/Common/IGroupArray";

declare module "./Queryable" {
    interface Queryable<T> {
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, [T | null, T2 | null]>): Queryable<Unquerify<TResult>>;
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: (item1: Querify<T> | null, item2: Querify<T2> | null) => TResult): Queryable<Unquerify<TResult>>;
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, [T | null, T2 | null]> | ((item1: Querify<T> | null, item2: Querify<T2> | null) => TResult)): Queryable<Unquerify<TResult>>;

        distinct(): Queryable<T>;

        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T | null, T2 | null]>): Queryable<Unquerify<TResult>>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T> | null, item2: Querify<T2> | null) => TResult): Queryable<Unquerify<TResult>>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: Querify<T>, item2: Querify<T2>) => boolean), resultSelector: FunctionExpression<TResult, [T | null, T2 | null]> | ((item1: Querify<T> | null, item2: Querify<T2> | null) => TResult)): Queryable<Unquerify<TResult>>;

        groupBy<K>(keySelector: (item: Querify<T>) => K): Queryable<IGroupArray<K, T>>;
        groupBy<K>(keySelector: FunctionExpression<K, [T]>): Queryable<IGroupArray<K, T>>;
        groupBy<K>(keySelector: FunctionExpression<K, [T]> | ((item: Querify<T>) => K)): Queryable<IGroupArray<K, T>>;

        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T>, item2: Enumerable<Querify<T2>>) => TResult): Queryable<Unquerify<TResult>>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T, Enumerable<T2>]>): Queryable<Unquerify<TResult>>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: Querify<T>, item2: Querify<T2>) => boolean), resultSelector: FunctionExpression<TResult, [T, Enumerable<T2>]> | ((item1: Querify<T>, item2: Enumerable<Querify<T2>>) => TResult)): Queryable<Unquerify<TResult>>;

        withRelated(...includes: Array<(item: Querify<T>) => Exclude<object, ValueType>>): Queryable<T>;
        withRelated(...includes: Array<FunctionExpression<Exclude<object, ValueType>, [T]>>): Queryable<T>;
        withRelated(...includes: Array<FunctionExpression<Exclude<object, ValueType>, [T]> | ((item: Querify<T>) => Exclude<object, ValueType>)>): Queryable<T>;

        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T, T2]>): Queryable<Unquerify<TResult>>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T>, item2: Querify<T2>) => TResult): Queryable<Unquerify<TResult>>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: Querify<T>, item2: Querify<T2>) => boolean), resultSelector: FunctionExpression<TResult, [T, T2]> | ((item1: Querify<T>, item2: Querify<T2>) => TResult)): Queryable<Unquerify<TResult>>;

        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T, T2 | null]>): Queryable<Unquerify<TResult>>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T>, item2: Querify<T2> | null) => TResult): Queryable<Unquerify<TResult>>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: Querify<T>, item2: Querify<T2> | null) => boolean), resultSelector: FunctionExpression<TResult, [T, T2 | null]> | ((item1: Querify<T>, item2: Querify<T2> | null) => TResult)): Queryable<Unquerify<TResult>>;

        option(option: IQueryOption): Queryable<T>;

        orderBy(...selectors: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>>): Queryable<T>;
        orderBy(...selectors: Array<IOrderDefinition<Querify<T>>>): Queryable<T>;

        parameter(params: { [key: string]: unknown }): Queryable<T>;

        pivot<TD extends { [key: string]: (o: Querify<T>) => ValueType }, TM extends { [key: string]: (o: Querify<T[]>) => ValueType }>(dimensions: TD, metrics: TM): Queryable<Pivot<T, TD, TM>>;
        pivot<TD extends { [key: string]: (o: Querify<T>) => ValueType }, TM extends { [key: string]: (o: Querify<T[]>) => ValueType }>(dimensions: FunctionExpression<PivotD<T, TD>, [T]>, metrics: FunctionExpression<PivotM<T, TM>, [IEnumerable<T>]>): Queryable<Pivot<T, TD, TM>>;
        pivot<TD extends { [key: string]: (o: Querify<T>) => ValueType }, TM extends { [key: string]: (o: Querify<T[]>) => ValueType }>(dimensions: TD | FunctionExpression<PivotD<T, TD>, [T]>, metrics: TM | FunctionExpression<PivotM<T, TM>, [IEnumerable<T>]>): Queryable<Pivot<T, TD, TM>>;

        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T | null, T2]>): Queryable<Unquerify<TResult>>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: Querify<T>, item2: Querify<T2>) => boolean, resultSelector: (item1: Querify<T> | null, item2: Querify<T2>) => TResult): Queryable<Unquerify<TResult>>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: Querify<T>, item2: Querify<T2>) => boolean), resultSelector: FunctionExpression<TResult, [T | null, T2]> | ((item1: Querify<T> | null, item2: Querify<T2>) => TResult)): Queryable<Unquerify<TResult>>;

        map<TReturn>(selector: (item: Querify<T>) => TReturn, type?: IObjectType<TReturn>): Queryable<Unquerify<TReturn>>;
        map<TReturn>(selector: FunctionExpression<TReturn, [T]>, type?: IObjectType<TReturn>): Queryable<TReturn>;
        map<TReturn>(selector: FunctionExpression<TReturn, [T]> | ((item: Querify<T>) => TReturn), type: IObjectType<TReturn>): Queryable<Unquerify<TReturn>>;

        flatMap<TReturn>(selector: (item: Querify<T>) => Iterable<TReturn>, type?: GenericType<TReturn>): Queryable<Unquerify<TReturn>>;
        flatMap<TReturn>(selector: FunctionExpression<Iterable<TReturn>, [T]>, type?: GenericType<TReturn>): Queryable<Unquerify<TReturn>>;
        flatMap<TReturn>(selector: FunctionExpression<Iterable<TReturn>, [T]> | ((item: Querify<T>) => IEnumerable<TReturn>), type?: GenericType<TReturn>): Queryable<Unquerify<TReturn>>;

        slice(start: number, end?: number): Queryable<T>;

        union(...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T>;
        intersect(...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T>;
        except(...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T>;
        concat(...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T>;

        filter(predicate: (item: Querify<T>) => boolean): Queryable<T>;
        filter(predicate: FunctionExpression<boolean, [T]>): Queryable<T>;
        filter(predicate: FunctionExpression<boolean, [T]> | ((item: Querify<T>) => boolean)): Queryable<T>;
    }
}

Queryable.prototype.map = function <T, TReturn>(this: Queryable<T>, selector: FunctionExpression<TReturn, [T]> | ((item: T) => TReturn), type?: IObjectType<Unquerify<TReturn>>): Queryable<Unquerify<TReturn>> {
    return new SelectQueryable(this, selector as FunctionExpression<Unquerify<TReturn>, [T]>, type);
};
Queryable.prototype.parameter = function <T>(this: Queryable<T>, params: { [key: string]: unknown }): Queryable<T> {
    return new ParameterQueryable(this, params);
};
Queryable.prototype.option = function <T>(this: Queryable<T>, option: IQueryOption): Queryable<T> {
    return new OptionQueryable(this, option);
};
Queryable.prototype.flatMap = function <T, TReturn>(this: Queryable<T>, selector: FunctionExpression<Iterable<TReturn>, [T]> | ((item: T) => Iterable<TReturn>), type?: GenericType<TReturn>): Queryable<Unquerify<TReturn>> {
    return new SelectManyQueryable(this, selector as FunctionExpression<IEnumerable<Unquerify<TReturn>>, [T]>, type as GenericType<Unquerify<TReturn>>);
};
Queryable.prototype.filter = function <T>(this: Queryable<T>, predicate: FunctionExpression<boolean, [T]> | ((item: T) => boolean)): Queryable<T> {
    return new WhereQueryable(this, predicate);
};
Queryable.prototype.orderBy = function <T>(this: Queryable<T>, ...selectors: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>> | Array<IOrderDefinition<T>>): Queryable<T> {
    return new OrderQueryable(this, ...selectors);
};
Queryable.prototype.slice = function <T>(this: Queryable<T>, start: number, end?: number): Queryable<T> {
    return new SliceQueryable(this, start, end);
};
Queryable.prototype.groupBy = function <T, K>(this: Queryable<T>, keySelector: FunctionExpression<K, [T]> | ((item: T) => K)): Queryable<IGroupArray<K, T>> {
    return new GroupByQueryable(this, keySelector);
};
Queryable.prototype.distinct = function <T>(this: Queryable<T>): Queryable<T> {
    return new DistinctQueryable(this);
};
Queryable.prototype.groupJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<TResult, [T, Enumerable<T2>]> | ((item1: T, item2: Enumerable<T2>) => TResult)): Queryable<TResult> {
    return new GroupJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.innerJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<TResult, [T, T2]> | ((item1: T, item2: T2) => TResult)): Queryable<TResult> {
    return new InnerJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.leftJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<TResult, [T, T2 | null]> | ((item1: T, item2: T2 | null) => TResult)): Queryable<TResult> {
    return new LeftJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.rightJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<TResult, [T | null, T2]> | ((item1: T | null, item2: T2) => TResult)): Queryable<TResult> {
    return new RightJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.fullJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<TResult, [T | null, T2 | null]> | ((item1: T | null, item2: T2 | null) => TResult)): Queryable<TResult> {
    return new FullJoinQueryable(this, array2, relation, resultSelector);
};
Queryable.prototype.crossJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, resultSelector: FunctionExpression<TResult, [T | null, T2 | null]> | ((item1: T | null, item2: T2 | null) => TResult)): Queryable<TResult> {
    return new CrossJoinQueryable(this, array2, resultSelector);
};
Queryable.prototype.union = function <T>(this: Queryable<T>, ...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T> {
    return new UnionQueryable(this, ...items);
};
Queryable.prototype.concat = function <T>(this: Queryable<T>, ...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T> {
    return new ConcatQueryable(this, ...items);
};
Queryable.prototype.intersect = function <T>(this: Queryable<T>, ...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T> {
    return new IntersectQueryable(this, ...items);
};
Queryable.prototype.except = function <T>(this: Queryable<T>, ...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T> {
    return new ExceptQueryable(this, ...items);
};
Queryable.prototype.pivot = function <T, TD extends { [key: string]: (o: Querify<T>) => ValueType }, TM extends { [key: string]: (o: Querify<T[]>) => ValueType }>(this: Queryable<T>, dimensions: TD | FunctionExpression<PivotD<T, TD>, [T]>, metrics: TM | FunctionExpression<PivotM<T, TM>, [IEnumerable<T>]>): Queryable<Pivot<T, TD, TM>> {
    return new PivotQueryable(this, dimensions, metrics);
};
Queryable.prototype.withRelated = function <T>(this: Queryable<T>, ...includes: FunctionExpression<Exclude<object, ValueType>, [T]>[] | Array<(item: T) => Exclude<object, ValueType>>): Queryable<T> {
    return new IncludeQueryable(this, includes);
};

export { Queryable };