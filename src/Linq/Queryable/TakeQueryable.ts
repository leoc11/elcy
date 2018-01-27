import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class TakeQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type);
    }
    public buildQuery() {
        if (!this.expression) {
            this.expression = new SelectExpression(this.parent.buildQuery() as any);
            this.expression.paging.take = this.quantity;
        }
        return this.expression;
    }
}
