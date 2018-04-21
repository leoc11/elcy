import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { hashCode } from "../Helper/Util";

export class TakeQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type);
        this.setParameters(this.parent.parameters);
    }
    public buildQuery(queryBuilder: QueryBuilder) {
        if (!this.expression) {
            this.expression = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            if (typeof this.expression.paging.take !== "number")
                this.expression.paging.take = this.quantity;
            else
                this.expression.paging.take = Math.min(this.quantity, this.expression.paging.take);
        }
        return this.expression;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("TAKE") + this.quantity;
    }
}
