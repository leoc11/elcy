import { Queryable } from "./Queryable";
import { IntersectExpression, ProjectionEntityExpression, SelectExpression } from "./QueryExpression";

export class IntersectQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type, parent.queryBuilder);
    }
    public buildQuery(): SelectExpression<T> {
        if (!this.expression) {
            const exceptEntity = new IntersectExpression(
                new ProjectionEntityExpression(new SelectExpression(this.parent.buildQuery() as any), this.queryBuilder.newAlias()),
                new ProjectionEntityExpression(new SelectExpression(this.parent2.buildQuery() as any), this.queryBuilder.newAlias()));

            this.expression = exceptEntity;
        }
        return this.expression as any;
    }
}
