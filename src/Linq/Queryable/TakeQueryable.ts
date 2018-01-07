import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class TakeQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent.queryBuilder);
    }
    public execute() {
        if (!this.expression) {
            this.expression = new SelectExpression(this.parent.execute() as any);
            this.expression.paging.take = this.quantity;
        }
        return this.expression;
    }
}
