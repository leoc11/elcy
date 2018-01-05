import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";

export class DistinctQueryable<T> extends Queryable<T> {
    protected readonly selector?: FunctionExpression<T, any>;
    constructor(public readonly parent: Queryable<T>, selector?: FunctionExpression<T, any> | ((item: T) => any)) {
        super(parent.type, parent.queryBuilder);
        if (selector)
            this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression<T, any>(selector, parent.type);
    }
}
