import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class SkipQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent.queryBuilder);
    }
    public buildQuery(): SelectExpression<T> {
        if (!this.expression) {
            this.expression = new SelectExpression(this.parent.buildQuery() as any);
            this.expression.paging.skip = this.quantity;
        }
        return this.expression;
    }
}
