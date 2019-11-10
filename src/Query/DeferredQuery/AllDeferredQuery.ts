import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryResultsParser } from "../IQueryResultsParser";
import { IQueryVisitor } from "../IQueryVisitor";
import { IQueryVisitParameter } from "../IQueryVisitParameter";
import { DQLDeferredQuery } from "./DQLDeferredQuery";

export class AllDeferredQuery<T> extends DQLDeferredQuery<boolean> {
    protected get predicate() {
        if (!this._predicate && this.predicateFn) {
            this._predicate = ExpressionBuilder.parse(this.predicateFn, [this.queryable.type], this.queryable.stackTree.node);
        }
        return this._predicate;
    }
    protected set predicate(value) {
        this._predicate = value;
    }
    constructor(queryable: Queryable<T>, predicate: FunctionExpression<boolean> | ((item: T) => boolean)) {
        super(queryable);
        if (predicate instanceof FunctionExpression) {
            this.predicate = predicate;
        }
        else {
            this.predicateFn = predicate;
        }
    }
    protected readonly predicateFn: (item: unknown) => boolean;
    private _predicate: FunctionExpression<boolean>;
    protected getResultParser(): IQueryResultsParser<boolean> {
        return (result: IQueryResult[]) => !result.first().rows.any();
    }
    protected buildQuery(visitor: IQueryVisitor): QueryExpression {
        const objectOperand = this.queryable.buildQuery(visitor) as unknown as SelectExpression;
        objectOperand.includes = [];
        const methodExpression = new MethodCallExpression(objectOperand, "all", [this.predicate]);
        const param: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return visitor.visit(methodExpression, param) as any;
    }
    protected getQueryCacheKey() {
        return hashCodeAdd(hashCode("ALL", super.getQueryCacheKey()), this.predicate.hashCode());
    }
}
