import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class DistinctQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    protected readonly selector?: FunctionExpression<T, any>;
    constructor(public readonly parent: Queryable<T>) {
        super(parent.type);
    }
    public buildQuery(): any {
        if (!this.expression) {
            const selectExp = new SelectExpression(this.parent.buildQuery() as any);
            selectExp.distinct = true;
            this.expression = selectExp;
        }
        return this.expression;
    }
}
