import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { ProjectionEntityExpression, SelectExpression, UnionExpression } from "./QueryExpression/index";

export class UnionQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type);
    }
    public buildQuery(): SelectExpression<T> {
        if (!this.expression) {
            const unionEntity = new UnionExpression(
                new ProjectionEntityExpression(new SelectExpression(this.parent.buildQuery() as any), this.queryBuilder.newAlias()),
                new ProjectionEntityExpression(new SelectExpression(this.parent2.buildQuery(this.queryBuilder) as any), this.queryBuilder.newAlias()),
                this.isUnionAll);

            this.expression = unionEntity;
        }
        return this.expression;
    }
}
