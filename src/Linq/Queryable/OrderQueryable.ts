import { orderDirection } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";

export class OrderQueryable<T> extends Queryable<T> {
    protected readonly selector: FunctionExpression<T, any>;
    constructor(public readonly parent: Queryable<T>, selector: FunctionExpression<T, any> | ((item: T) => any), protected readonly direction: orderDirection) {
        super(parent.type, parent.queryBuilder);
        this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression(selector, parent.type);
    }
}
