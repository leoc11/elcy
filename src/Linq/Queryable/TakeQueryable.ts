import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class TakeQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type);
    }
    public buildQuery(queryBuilder?: QueryBuilder) {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            this.expression = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            this.expression.paging.take = this.quantity;
        }
        return this.expression;
    }
}
