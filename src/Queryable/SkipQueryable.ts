import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { hashCode } from "../Helper/Util";
import { isNumber } from "util";

export class SkipQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type);
        this.setParameters(this.parent.parameters);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            this.expression = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            if (typeof this.expression.paging.skip === "undefined")
                this.expression.paging.skip = 0;
            this.expression.paging.skip += this.quantity;
        }
        return this.expression;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("SKIP") + this.quantity;
    }
}
