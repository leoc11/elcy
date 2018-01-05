import { IObjectType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";

export class RightJoinQueryable<T = any, T2 = any, K = any, R = any> extends Queryable<R> {
    protected readonly keySelector1: FunctionExpression<T, K>;
    protected readonly keySelector2: FunctionExpression<T2, K>;
    protected readonly resultSelector: FunctionExpression<T | T2, R>;
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<T | T2, R> | ((item1: T | null, item2: T2) => R), public type: IObjectType<R> = Object as any) {
        super(type, parent.queryBuilder);
        this.keySelector1 = keySelector1 instanceof FunctionExpression ? keySelector1 : ExpressionFactory.prototype.ToExpression<T, K>(keySelector1, parent.type);
        this.keySelector2 = keySelector2 instanceof FunctionExpression ? keySelector2 : ExpressionFactory.prototype.ToExpression<T2, K>(keySelector2, parent2.type);
        if (resultSelector)
            this.resultSelector = resultSelector instanceof FunctionExpression ? resultSelector : ExpressionFactory.prototype.ToExpression2<T, T2, R>(resultSelector, parent.type, parent2.type);
    }
}
