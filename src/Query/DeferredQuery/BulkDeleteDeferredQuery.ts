import { DeleteMode } from "../../Common/StringType";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { DeleteExpression } from "../../Queryable/QueryExpression/DeleteExpression";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

// TODO: currently cache only work when query has same delete mode.
export class BulkDeleteDeferredQuery<T> extends DMLDeferredQuery<T> {
    constructor(queryable: Queryable<T>, protected readonly mode: DeleteMode) {
        super(queryable);
    }
    protected buildQueries(visitor: IQueryVisitor): Array<QueryExpression<T>> {
        const objectOperand = this.queryable.buildQuery(visitor) as SelectExpression<T>;
        return [new DeleteExpression(objectOperand, this.mode)];
    }
    protected getQueryCacheKey() {
        return hashCodeAdd(hashCode("DELETE", super.getQueryCacheKey()), hashCode(this.mode));
    }
}
