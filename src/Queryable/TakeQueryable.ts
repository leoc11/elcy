import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { hashCode } from "../Helper/Util";

export class TakeQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent);
    }
    public buildQuery(queryBuilder: QueryBuilder) {
        const res = this.parent.buildQuery(queryBuilder) as SelectExpression<T>;
        if (typeof res.paging.take !== "number")
            res.paging.take = this.quantity;
        else
            res.paging.take = Math.min(this.quantity, res.paging.take);
        return res;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("TAKE") + this.quantity;
    }
}
