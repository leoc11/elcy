import { orderDirection } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression, ValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class OrderQueryable<T> extends Queryable<T> {
    protected readonly selector: FunctionExpression<T, any>;
    constructor(public readonly parent: Queryable<T>, selector: FunctionExpression<T, any> | ((item: T) => any), protected readonly direction: orderDirection) {
        super(parent.type, parent.queryBuilder);
        this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression(selector, parent.type);
    }
    public buildQuery(): SelectExpression {
        if (!this.expression) {
            this.expression = new SelectExpression(this.parent.buildQuery() as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, "orderBy", [this.selector, new ValueExpression(this.direction)]);
            const param = { parent: this.expression, type: "orderBy" };
            this.queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression as any;
    }
}
