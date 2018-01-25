import { IObjectType, JoinType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";

export class LeftJoinQueryable<T = any, T2 = any, K = any, R = any> extends JoinQueryable<T, T2, K, R>  {
    protected readonly keySelector1: FunctionExpression<T, K>;
    protected readonly keySelector2: FunctionExpression<T2, K>;
    protected readonly resultSelector: FunctionExpression<T | T2, R>;
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<T | T2, R> | ((item1: T, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(JoinType.LEFT, parent, parent2, keySelector1, keySelector2, resultSelector, type);
    }
}
