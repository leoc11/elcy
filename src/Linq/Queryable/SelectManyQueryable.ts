import { genericType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";

export class SelectManyQueryable<S, T> extends Queryable<T> {
    protected readonly selector: FunctionExpression<S, T[] | Queryable<T>>;
    constructor(public type: genericType<T>, public readonly parent: Queryable<S>, selector: FunctionExpression<S, T[] | Queryable<T>> | ((item: S) => T[] | Queryable<T>)) {
        super(type, parent.queryBuilder);
        this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression<S, T[] | Queryable<T>>(selector, parent.type);
    }
}
