import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { Queryable } from "./Queryable";

export class GroupByQueryable<T, K> extends Queryable<GroupedEnumerable<T, K>> {
    protected readonly keySelector: FunctionExpression<T, K>;
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(type, parent.queryBuilder);
        this.keySelector = keySelector instanceof FunctionExpression ? keySelector : ExpressionFactory.prototype.ToExpression(keySelector, parent.type);
    }
}
