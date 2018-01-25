import { genericType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class IncludeQueryable<T> extends Queryable<T> {
    protected readonly selectors: Array<FunctionExpression<T, any>>;
    constructor(public readonly parent: Queryable<T>, selectors: Array<((item: T) => any) | FunctionExpression<T, any>>, public type: genericType<T> = Object) {
        super(type, parent.queryBuilder);
        this.selectors = selectors.select((o) => o instanceof FunctionExpression ? o : ExpressionFactory.prototype.ToExpression<T, any>(o, parent.type)).toArray();
    }
    public execute(): SelectExpression<T> {
        if (!this.expression) {
            this.expression = new SelectExpression<any>(this.parent.execute() as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, "include", this.selectors);
            const param = { parent: this.expression, type: "include" };
            this.queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression as any;
    }
}
