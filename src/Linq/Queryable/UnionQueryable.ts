import { Queryable } from "./Queryable";
import { ProjectionEntityExpression, SelectExpression, UnionExpression } from "./QueryExpression/index";

export class UnionQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type, parent.queryBuilder);
    }
    public buildQuery(): SelectExpression<T> {
        if (!this.expression) {
            const unionEntity = new UnionExpression(
                new ProjectionEntityExpression(new SelectExpression(this.parent.buildQuery() as any), this.queryBuilder.newAlias()),
                new ProjectionEntityExpression(new SelectExpression(this.parent2.buildQuery() as any), this.queryBuilder.newAlias()),
                this.isUnionAll);

            this.expression = unionEntity;
        }
        return this.expression;
    }
}
