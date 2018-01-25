import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
// import { IGroupArray } from "../Interface/IGroupArray";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class GroupByQueryable<T, K> extends Queryable<GroupedEnumerable<T, K>> {
    public expression: SelectExpression<GroupedEnumerable<T, K>>;
    protected readonly keySelector: FunctionExpression<T, K>;
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(Array as any, parent.queryBuilder);
        this.keySelector = keySelector instanceof FunctionExpression ? keySelector : ExpressionFactory.prototype.ToExpression(keySelector, parent.type);
    }
    public buildQuery(): SelectExpression<GroupedEnumerable<T, K>> {
        if (!this.expression) {
            this.expression = new SelectExpression<any>(this.parent.buildQuery() as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, "groupBy", [this.keySelector]);
            const param = { parent: this.expression, type: "groupBy" };
            this.queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression;
    }
}
