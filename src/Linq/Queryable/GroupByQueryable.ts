import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { IGroupArray } from "../Interface/IGroupArray";
import { Queryable } from "./Queryable";

export class GroupByQueryable<T, K> extends Queryable<IGroupArray<T, K>> {
    protected readonly keySelector: FunctionExpression<T, K>;
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(Array, parent.queryBuilder);
        this.keySelector = keySelector instanceof FunctionExpression ? keySelector : ExpressionFactory.prototype.ToExpression(keySelector, parent.type);
    }
}
