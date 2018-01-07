import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class WhereQueryable<T> extends Queryable<T> {
    protected readonly predicate: FunctionExpression<T, boolean>;
    constructor(public readonly parent: Queryable<T>, predicate: FunctionExpression<T, boolean> | ((item: T) => boolean)) {
        super(parent.type, parent.queryBuilder);
        this.predicate = predicate instanceof FunctionExpression ? predicate : ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, parent.type);
    }
    public execute() {
        if (!this.expression) {
            this.expression = new SelectExpression(this.parent.execute());
            const methodExpression = new MethodCallExpression(this.expression.entity, "where", [this.predicate]);
            const param = { parent: this.expression };
            this.queryBuilder.visit(methodExpression, param);
            this.expression = param.parent;
        }
        return this.expression;
    }
}