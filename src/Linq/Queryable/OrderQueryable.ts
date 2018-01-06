import { orderDirection } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class OrderQueryable<T> extends Queryable<T> {
    protected readonly selector: FunctionExpression<T, any>;
    constructor(public readonly parent: Queryable<T>, selector: FunctionExpression<T, any> | ((item: T) => any), protected readonly direction: orderDirection) {
        super(parent.type, parent.queryBuilder);
        this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression(selector, parent.type);
    }
    public execute() {
        if (!this.expression) {
            this.expression = new SelectExpression(this.parent.execute());
            this.queryBuilder.parameters.add(this.selector.Params[0].name, this.type);
            const param = { parent: this.expression };
            const orderByExpression = this.queryBuilder.visit(this.selector, param);
            this.queryBuilder.parameters.remove(this.selector.Params[0].name);
            this.expression = param.parent;
            this.expression.orders.add({ column: orderByExpression, direction: this.direction });
            return this.expression;
        }
        return this.expression;
    }
}
