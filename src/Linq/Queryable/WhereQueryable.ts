import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
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
            this.queryBuilder.parameters.add(this.predicate.Params[0].name, this.type);
            const param = { parent: this.expression };
            const whereExpression = this.queryBuilder.visit(this.predicate, param);
            this.queryBuilder.parameters.remove(this.predicate.Params[0].name);
            this.expression = param.parent;
            this.expression.where = whereExpression;
        }
        return this.expression;
    }
}
