import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { hashCode } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryResultsParser } from "../IQueryResultsParser";
import { IQueryVisitor } from "../IQueryVisitor";
import { IQueryVisitParameter } from "../IQueryVisitParameter";
import { DQLDeferredQuery } from "./DQLDeferredQuery";

export class AnyDeferredQuery<T> extends DQLDeferredQuery<boolean> {
    constructor(queryable: Queryable<T>) {
        super(queryable);
    }
    protected getResultParser(): IQueryResultsParser<boolean> {
        return (result: IQueryResult[]) => result.first().rows.any();
    }
    protected buildQuery(visitor: IQueryVisitor): QueryExpression {
        const objectOperand = this.queryable.buildQuery(visitor) as unknown as SelectExpression;
        objectOperand.includes = [];
        const methodExpression = new MethodCallExpression(objectOperand, "any", []);
        const param: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return visitor.visit(methodExpression, param) as any;
    }
    protected getQueryCacheKey() {
        return hashCode("ANY", super.getQueryCacheKey());
    }
}
