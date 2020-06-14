import { IObjectType } from "../../Common/Type";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { InsertIntoExpression } from "../../Queryable/QueryExpression/InsertIntoExpression";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

export class InsertIntoDeferredQuery<T> extends DMLDeferredQuery<T> {
    constructor(queryable: Queryable<T>, protected readonly type: IObjectType) {
        super(queryable);
    }
    protected buildQueries(visitor: IQueryVisitor): Array<QueryExpression<T[]>> {
        const objectOperand = this.queryable.buildQuery(visitor) as SelectExpression<T>;

        const targetSet = this.dbContext.set(this.type);
        const entityExp = new EntityExpression(targetSet.type, visitor.newAlias());
        return [new InsertIntoExpression(entityExp, objectOperand)];
    }
    protected getQueryCacheKey() {
        return hashCodeAdd(hashCode("INSERTINTO", super.getQueryCacheKey()), hashCode(this.type.name));
    }
}
