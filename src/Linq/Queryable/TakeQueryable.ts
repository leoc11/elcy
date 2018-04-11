import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { hashCode } from "../../Helper/Util";

export class TakeQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder) {
        if (!this.expression) {
            this.expression = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            this.expression.paging.take = this.quantity;
        }
        return this.expression;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("TAKE") + this.quantity;
    }
}
