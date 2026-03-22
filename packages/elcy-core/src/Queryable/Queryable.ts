import { GenericType, IObjectType, Pivot, ValueType } from "../Common/Type";
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
import { PivotQueryable, TExpObject } from "./PivotQueryable";
import { ProjectQueryable } from "./ProjectQueryable";
import { RightJoinQueryable } from "./RightJoinQueryable";
import { SelectManyQueryable } from "./SelectManyQueryable";
import { SelectQueryable } from "./SelectQueryable";
import { UnionQueryable } from "./UnionQueryable";
import { WhereQueryable } from "./WhereQueryable";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IOrderDefinition } from "@elcy/enumerable";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { OrderDirection } from "../Common/StringType";
import { QueryableChain, Unchain } from "./Interface/QueryableChain";
import { ConcatQueryable } from "./ConcatQueryable";
import { SliceQueryable } from "./SliceQueryable";
import { IGroupArray } from "src/Common/IGroupArray";

declare module "./Queryable" {
    interface Queryable<T> {
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, [T | null, T2 | null]>): Queryable<TResult>;
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: (item1: QueryableChain<T> | null, item2: QueryableChain<T2> | null) => TResult): Queryable<TResult>;
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, [T | null, T2 | null]> | ((item1: QueryableChain<T> | null, item2: QueryableChain<T2> | null) => TResult)): Queryable<TResult>;

        distinct(): Queryable<T>;

        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T | null, T2 | null]>): Queryable<TResult>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector: (item1: QueryableChain<T> | null, item2: QueryableChain<T2> | null) => TResult): Queryable<TResult>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean), resultSelector: FunctionExpression<TResult, [T | null, T2 | null]> | ((item1: QueryableChain<T> | null, item2: QueryableChain<T2> | null) => TResult)): Queryable<TResult>;

        groupBy<K>(keySelector: (item: QueryableChain<T>) => K): Queryable<IGroupArray<K, T>>;
        groupBy<K>(keySelector: FunctionExpression<K, [T]>): Queryable<IGroupArray<K, T>>;
        groupBy<K>(keySelector: FunctionExpression<K, [T]> | ((item: QueryableChain<T>) => K)): Queryable<IGroupArray<K, T>>;

        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector: (item1: QueryableChain<T>, item2: Enumerable<QueryableChain<T2>>) => TResult): Queryable<TResult>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T, Enumerable<T2>]>): Queryable<TResult>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean), resultSelector: FunctionExpression<TResult, [T, Enumerable<T2>]> | ((item1: QueryableChain<T>, item2: Enumerable<QueryableChain<T2>>) => TResult)): Queryable<TResult>;

        loads(...includes: Array<(item: QueryableChain<T>) => Exclude<object, ValueType>>): Queryable<T>;
        loads(...includes: Array<FunctionExpression<Exclude<object, ValueType>, [T]>>): Queryable<T>;
        loads(...includes: Array<FunctionExpression<Exclude<object, ValueType>, [T]> | ((item: QueryableChain<T>) => Exclude<object, ValueType>)>): Queryable<T>;

        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T, T2]>): Queryable<TResult>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector: (item1: QueryableChain<T>, item2: QueryableChain<T2>) => TResult): Queryable<TResult>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean), resultSelector: FunctionExpression<TResult, [T, T2]> | ((item1: QueryableChain<T>, item2: QueryableChain<T2>) => TResult)): Queryable<TResult>;

        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T, T2 | null]>): Queryable<TResult>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector: (item1: QueryableChain<T>, item2: QueryableChain<T2> | null) => TResult): Queryable<TResult>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: QueryableChain<T>, item2: QueryableChain<T2> | null) => boolean), resultSelector: FunctionExpression<TResult, [T, T2 | null]> | ((item1: QueryableChain<T>, item2: QueryableChain<T2> | null) => TResult)): Queryable<TResult>;

        option(option: IQueryOption): Queryable<T>;

        orderBy(...selectors: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>>): Queryable<T>;
        orderBy(...selectors: Array<IOrderDefinition<QueryableChain<T>>>): Queryable<T>;

        parameter(params: { [key: string]: unknown }): Queryable<T>;

        pivot<TD extends { [key: string]: (item: QueryableChain<T>) => ValueType }, TM extends { [key: string]: (item: Enumerable<QueryableChain<T>>) => ValueType }>(dimensions: TD, metrics: TM): Queryable<Pivot<T, TD, TM>>;
        pivot<TD extends { [key: string]: (item: QueryableChain<T>) => ValueType }, TM extends { [key: string]: (item: Enumerable<QueryableChain<T>>) => ValueType }>(dimensions: TExpObject<TD>, metrics: TExpObject<TM>): Queryable<Pivot<T, TD, TM>>;
        pivot<TD extends { [key: string]: (item: QueryableChain<T>) => ValueType }, TM extends { [key: string]: (item: Enumerable<QueryableChain<T>>) => ValueType }>(dimensions: TD | TExpObject<TD>, metrics: TM | TExpObject<TM>): Queryable<Pivot<T, TD, TM>>;

        project(...includes: Array<(item: QueryableChain<T>) => ValueType>): Queryable<T>;
        project(...includes: FunctionExpression<ValueType, [T]>[]): Queryable<T>;
        project(...includes: FunctionExpression<ValueType, [T]>[] | Array<(item: QueryableChain<T>) => ValueType>): Queryable<T>;

        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]>, resultSelector: FunctionExpression<TResult, [T | null, T2]>): Queryable<TResult>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector: (item1: QueryableChain<T> | null, item2: QueryableChain<T2>) => TResult): Queryable<TResult>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean), resultSelector: FunctionExpression<TResult, [T | null, T2]> | ((item1: QueryableChain<T> | null, item2: QueryableChain<T2>) => TResult)): Queryable<TResult>;

        map<TReturn>(selector: FunctionExpression<TReturn, [T]> | ((item: QueryableChain<T>) => TReturn)): Queryable<Unchain<TReturn>>;
        map<TReturn>(type: IObjectType<TReturn>, selector: FunctionExpression<TReturn, [T]> | ((item: QueryableChain<T>) => { [key in keyof TReturn]?: TReturn[key] })): Queryable<Unchain<TReturn>>;
        map<TReturn>(typeOrSelector: FunctionExpression<TReturn, [T]> | IObjectType<TReturn> | ((item: QueryableChain<T>) => TReturn), selector?: ((item: QueryableChain<T>) => TReturn)): Queryable<Unchain<TReturn>>;

        flatMap<TReturn>(selector: (item: QueryableChain<T>) => IEnumerable<TReturn>, type?: GenericType<TReturn>): Queryable<Unchain<TReturn>>;
        flatMap<TReturn>(selector: FunctionExpression<IEnumerable<TReturn>, [T]>, type?: GenericType<TReturn>): Queryable<Unchain<TReturn>>;
        flatMap<TReturn>(selector: FunctionExpression<IEnumerable<TReturn>, [T]> | ((item: QueryableChain<T>) => IEnumerable<TReturn>), type?: GenericType<TReturn>): Queryable<Unchain<TReturn>>;

        slice(start: number, end?: number): Queryable<T>;

        union(...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T>;
        intersect(...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T>;
        except(...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T>;
        concat(...items: [Queryable<T>, ...Queryable<T>[]]): Queryable<T>;

        filter(predicate: (item: QueryableChain<T>) => boolean): Queryable<T>;
        filter(predicate: FunctionExpression<boolean, [T]>): Queryable<T>;
        filter(predicate: FunctionExpression<boolean, [T]> | ((item: QueryableChain<T>) => boolean)): Queryable<T>;
    }
}

Queryable.prototype.map = function <T, TReturn>(this: Queryable<T>, typeOrSelector: IObjectType<TReturn> | FunctionExpression<TReturn, [T]> | ((item: T) => TReturn), selector?: FunctionExpression<TReturn, [T]> | ((item: T) => TReturn)): Queryable<Unchain<TReturn>> {
    let type: IObjectType<Unchain<TReturn>>;
    if (!selector) {
        selector = typeOrSelector as FunctionExpression<TReturn, [T]> | ((item: T) => TReturn);
    }
    else {
        type = typeOrSelector as IObjectType<Unchain<TReturn>>;
    }
    return new SelectQueryable(this, selector as unknown as FunctionExpression<Unchain<TReturn>, [T]>, type);
};
Queryable.prototype.parameter = function <T>(this: Queryable<T>, params: { [key: string]: unknown }): Queryable<T> {
    return new ParameterQueryable(this, params);
};
Queryable.prototype.option = function <T>(this: Queryable<T>, option: IQueryOption): Queryable<T> {
    return new OptionQueryable(this, option);
};
Queryable.prototype.flatMap = function <T, TReturn>(this: Queryable<T>, selector: FunctionExpression<IEnumerable<TReturn>, [T]> | ((item: T) => IEnumerable<TReturn>), type?: GenericType<TReturn>): Queryable<Unchain<TReturn>> {
    return new SelectManyQueryable(this, selector as FunctionExpression<IEnumerable<Unchain<TReturn>>, [T]>, type as GenericType<Unchain<TReturn>>);
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
Queryable.prototype.pivot = function <T, TD extends { [key: string]: (item: QueryableChain<T>) => ValueType }, TM extends { [key: string]: (item: Enumerable<QueryableChain<T>>) => ValueType }>(this: Queryable<T>, dimensions: TD | TExpObject<TD>, metrics: TM | TExpObject<TM>): Queryable<Pivot<T, TD, TM>> {
    return new PivotQueryable(this, dimensions, metrics);
};
Queryable.prototype.loads = function <T>(this: Queryable<T>, ...includes: FunctionExpression<Exclude<object, ValueType>, [T]>[] | Array<(item: T) => Exclude<object, ValueType>>): Queryable<T> {
    return new IncludeQueryable(this, includes);
};
Queryable.prototype.project = function <T>(this: Queryable<T>, ...includes: FunctionExpression<ValueType, [T]>[] | Array<(item: T) => ValueType>): Queryable<T> {
    return new ProjectQueryable(this, includes);
};

export { Queryable };