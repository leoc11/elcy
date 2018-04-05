import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class SkipQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            this.expression = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            this.expression.paging.skip = this.quantity;
        }
        return this.expression;
    }
    public getHashCode() {
        return this.parent.getHashCode() + "-SK" + this.quantity;
    }
}
