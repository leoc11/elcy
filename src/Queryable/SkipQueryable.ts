import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { hashCode } from "../Helper/Util";

export class SkipQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        const res = this.parent.buildQuery(queryBuilder) as SelectExpression<T>;
        if (typeof res.paging.skip === "undefined")
            res.paging.skip = 0;
        if (typeof res.paging.take === "number")
            res.paging.take -= this.quantity;
        res.paging.skip += this.quantity;
        return res;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("SKIP") + this.quantity;
    }
}
