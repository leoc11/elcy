import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class DistinctQueryable<T> extends Queryable<T> {
    protected readonly selector?: FunctionExpression<T, any>;
    constructor(public readonly parent: Queryable<T>) {
        super(parent.type, parent.queryBuilder);
    }
    public buildQuery(): any {
        if (!this.expression) {
            const selectExp = new SelectExpression(this.parent.buildQuery() as any);
            selectExp.distinct = true;
            this.expression = selectExp;
        }
        return this.expression;
    }
}
