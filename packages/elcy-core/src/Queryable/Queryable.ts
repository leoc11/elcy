import { GenericType, IObjectType, Pivot, ValueType } from "../Common/Type";
import { Enumerable, GroupedEnumerable, IEnumerable } from "@elcy/enumerable";
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
import { IOrderDefinition } from "@elcy/enumerable";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { OrderDirection } from "../Common/StringType";
import { QueryableChain } from "./Interface/QueryableChain";

declare module "./Queryable" {
    interface Queryable<T> {
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, null | T | T2>): Queryable<TResult>;
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: (item1: QueryableChain<T> | null, item2: QueryableChain<T2> | null) => TResult): Queryable<TResult>;
        crossJoin<T2, TResult>(array2: Queryable<T2>, resultSelector?: FunctionExpression<TResult, null | T | T2> | ((item1: QueryableChain<T> | null, item2: QueryableChain<T2> | null) => TResult)): Queryable<TResult>;

        distinct(): Queryable<T>;
        except(array2: Queryable<T>): Queryable<T>;

        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, null | T | T2>): Queryable<TResult>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector?: (item1: QueryableChain<T> | null, item2: QueryableChain<T2> | null) => TResult): Queryable<TResult>;
        fullJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean), resultSelector?: FunctionExpression<TResult, null | T | T2> | ((item1: QueryableChain<T> | null, item2: QueryableChain<T2> | null) => TResult)): Queryable<TResult>;

        groupBy<K>(keySelector: (item: QueryableChain<T>) => K): Queryable<GroupedEnumerable<K, T>>;
        groupBy<K>(keySelector: FunctionExpression<K, T>): Queryable<GroupedEnumerable<K, T>>;
        groupBy<K>(keySelector: FunctionExpression<K, T> | ((item: QueryableChain<T>) => K)): Queryable<GroupedEnumerable<K, T>>;

        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector?: (item1: QueryableChain<T>, item2: Enumerable<QueryableChain<T2>>) => TResult): Queryable<TResult>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, T | T2[]>): Queryable<TResult>;
        groupJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean), resultSelector?: FunctionExpression<TResult, T | T2[]> | ((item1: QueryableChain<T>, item2: Enumerable<QueryableChain<T2>>) => TResult)): Queryable<TResult>;

        loads<TLoad extends object>(...includes: Array<FunctionExpression<TLoad extends ValueType ? never : TLoad, T>>): Queryable<T>;
        loads<TLoad extends object>(...includes: Array<(item: QueryableChain<T>) => TLoad extends ValueType ? never : TLoad>): Queryable<T>;
        loads<TLoad extends object>(...includes: Array<FunctionExpression<TLoad extends ValueType ? never : TLoad, T> | ((item: QueryableChain<T>) => TLoad extends ValueType ? never : TLoad)>): Queryable<T>;

        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, T | T2>): Queryable<TResult>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector?: (item1: QueryableChain<T>, item2: QueryableChain<T2>) => TResult): Queryable<TResult>;
        innerJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean), resultSelector?: FunctionExpression<TResult, T | T2> | ((item1: QueryableChain<T>, item2: QueryableChain<T2>) => TResult)): Queryable<TResult>;

        intersect(array2: Queryable<T>): Queryable<T>;

        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, T | T2 | null>): Queryable<TResult>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector?: (item1: QueryableChain<T>, item2: QueryableChain<T2> | null) => TResult): Queryable<TResult>;
        leftJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: QueryableChain<T>, item2: QueryableChain<T2> | null) => boolean), resultSelector?: FunctionExpression<TResult, T | T2> | ((item1: QueryableChain<T>, item2: QueryableChain<T2> | null) => TResult)): Queryable<TResult>;

        option(option: IQueryOption): Queryable<T>;

        orderBy(...selectors: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>>): Queryable<T>;
        orderBy(...selectors: Array<IOrderDefinition<QueryableChain<T>>>): Queryable<T>;

        parameter(params: { [key: string]: unknown }): Queryable<T>;

        pivot<TD extends { [key: string]: (item: QueryableChain<T>) => ValueType }, TM extends { [key: string]: (item: Enumerable<QueryableChain<T>>) => ValueType }>(dimensions: TD, metrics: TM): Queryable<Pivot<T, TD, TM>>;
        pivot<TD extends { [key: string]: (item: QueryableChain<T>) => ValueType }, TM extends { [key: string]: (item: Enumerable<QueryableChain<T>>) => ValueType }>(dimensions: TExpObject<TD>, metrics: TExpObject<TM>): Queryable<Pivot<T, TD, TM>>;
        pivot<TD extends { [key: string]: (item: QueryableChain<T>) => ValueType }, TM extends { [key: string]: (item: Enumerable<QueryableChain<T>>) => ValueType }>(dimensions: TD | TExpObject<TD>, metrics: TM | TExpObject<TM>): Queryable<Pivot<T, TD, TM>>;

        project(...includes: Array<(item: QueryableChain<T>) => ValueType>): Queryable<T>;
        project(...includes: FunctionExpression<ValueType, T>[]): Queryable<T>;
        project(...includes: FunctionExpression<ValueType, T>[] | Array<(item: QueryableChain<T>) => ValueType>): Queryable<T>;

        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2>, resultSelector?: FunctionExpression<TResult, T | null | T2>): Queryable<TResult>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: (item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean, resultSelector?: (item1: QueryableChain<T> | null, item2: QueryableChain<T2>) => TResult): Queryable<TResult>;
        rightJoin<T2, TResult>(array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: QueryableChain<T>, item2: QueryableChain<T2>) => boolean), resultSelector?: FunctionExpression<TResult, T | null | T2> | ((item1: QueryableChain<T> | null, item2: QueryableChain<T2>) => TResult)): Queryable<TResult>;

        map<TReturn>(selector: FunctionExpression<TReturn, T> | ((item: QueryableChain<T>) => TReturn)): Queryable<TReturn>;
        map<TReturn>(type: IObjectType<TReturn>, selector: FunctionExpression<TReturn, T> | ((item: QueryableChain<T>) => { [key in keyof TReturn]?: TReturn[key] })): Queryable<TReturn>;
        map<TReturn>(typeOrSelector: FunctionExpression<TReturn, T> | IObjectType<TReturn> | ((item: QueryableChain<T>) => TReturn), selector?: ((item: QueryableChain<T>) => TReturn)): Queryable<TReturn>;

        flatMap<TReturn>(selector: (item: QueryableChain<T>) => IEnumerable<TReturn>, type?: GenericType<TReturn>): Queryable<TReturn>;
        flatMap<TReturn>(selector: FunctionExpression<IEnumerable<TReturn>, T>, type?: GenericType<TReturn>): Queryable<TReturn>;
        flatMap<TReturn>(selector: FunctionExpression<IEnumerable<TReturn>, T> | ((item: QueryableChain<T>) => IEnumerable<TReturn>), type?: GenericType<TReturn>): Queryable<TReturn>;

        skip(skip: number): Queryable<T>;
        take(take: number): Queryable<T>;
        slice(skip: number, take?: number): Queryable<T>;
        union(array2: Queryable<T>): Queryable<T>;
        concat(...array2: Queryable<T>[]): Queryable<T>;

        filter(predicate: (item: QueryableChain<T>) => boolean): Queryable<T>;
        filter(predicate: FunctionExpression<boolean, T>): Queryable<T>;
        filter(predicate: FunctionExpression<boolean, T> | ((item: QueryableChain<T>) => boolean)): Queryable<T>;
    }
}

Queryable.prototype.map = function <T, TReturn>(this: Queryable<T>, typeOrSelector: IObjectType<TReturn> | FunctionExpression<TReturn, T> | ((item: T) => TReturn), selector?: FunctionExpression<TReturn, T> | ((item: T) => TReturn)): Queryable<TReturn> {
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
Queryable.prototype.flatMap = function <T, TReturn>(this: Queryable<T>, selector: FunctionExpression<IEnumerable<TReturn>, T> | ((item: T) => IEnumerable<TReturn>), type?: GenericType<TReturn>): Queryable<TReturn> {
    return new SelectManyQueryable(this, selector, type);
};
Queryable.prototype.filter = function <T>(this: Queryable<T>, predicate: FunctionExpression<boolean, T> | ((item: T) => boolean)): Queryable<T> {
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
Queryable.prototype.slice = function <T>(this: Queryable<T>, skip: number, take?: number): Queryable<T> {
    let result = this;
    if (typeof skip === "number" && skip > 0) {
        result = new SkipQueryable(result, skip);
    }
    if (typeof take === "number" && take > 0) {
        result = new TakeQueryable(result, take);
    }
    
    return result;
};
Queryable.prototype.groupBy = function <T, K>(this: Queryable<T>, keySelector: FunctionExpression<K, T> | ((item: T) => K)): Queryable<GroupedEnumerable<K, T>> {
    return new GroupByQueryable(this, keySelector);
};
Queryable.prototype.distinct = function <T>(this: Queryable<T>): Queryable<T> {
    return new DistinctQueryable(this);
};
Queryable.prototype.groupJoin = function <T, T2, TResult>(this: Queryable<T>, array2: Queryable<T2>, relation: FunctionExpression<boolean, T | T2> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<TResult, T | T2[]> | ((item1: T, item2: Enumerable<T2>) => TResult)): Queryable<TResult> {
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
Queryable.prototype.union = function <T>(this: Queryable<T>, array2: Queryable<T>): Queryable<T> {
    return new UnionQueryable(this, array2);
};
Queryable.prototype.concat = function <T>(this: Queryable<T>, ...items: Queryable<T>[]): Queryable<T> {
    let result: Queryable<T> = this;
    for (const item of items) {
        result = new UnionQueryable(result, item, true);
    }

    return result;
};
Queryable.prototype.intersect = function <T>(this: Queryable<T>, array2: Queryable<T>): Queryable<T> {
    return new IntersectQueryable(this, array2);
};
Queryable.prototype.except = function <T>(this: Queryable<T>, array2: Queryable<T>): Queryable<T> {
    return new ExceptQueryable(this, array2);
};
Queryable.prototype.pivot = function <T, TD extends { [key: string]: (item: QueryableChain<T>) => ValueType }, TM extends { [key: string]: (item: Enumerable<QueryableChain<T>>) => ValueType }>(this: Queryable<T>, dimensions: TD | TExpObject<TD>, metrics: TM | TExpObject<TM>): Queryable<Pivot<T, TD, TM>> {
    return new PivotQueryable(this, dimensions, metrics);
};
Queryable.prototype.loads = function <T, TLoad extends object>(this: Queryable<T>, ...includes: FunctionExpression<TLoad extends ValueType ? never : TLoad, T>[] | Array<(item: T) => TLoad extends ValueType ? never : TLoad>): Queryable<T> {
    return new IncludeQueryable(this, includes);
};
Queryable.prototype.project = function <T>(this: Queryable<T>, ...includes: FunctionExpression<ValueType, T>[] | Array<(item: T) => ValueType>): Queryable<T> {
    return new ProjectQueryable(this, includes);
};

export { Queryable };