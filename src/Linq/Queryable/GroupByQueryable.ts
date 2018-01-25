import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { IGroupArray } from "../Interface/IGroupArray";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class GroupByQueryable<T, K> extends Queryable<IGroupArray<T, K>> {
    public expression: SelectExpression<IGroupArray<T, K>>;
    protected readonly keySelector: FunctionExpression<T, K>;
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(Array, parent.queryBuilder);
        this.keySelector = keySelector instanceof FunctionExpression ? keySelector : ExpressionFactory.prototype.ToExpression(keySelector, parent.type);
    }
    public execute(): SelectExpression<IGroupArray<T, K>> {
        if (!this.expression) {
            this.expression = new SelectExpression<any>(this.parent.execute() as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, "groupBy", [this.keySelector]);
            const param = { parent: this.expression, type: "groupBy" };
            this.queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression;
    }
}
