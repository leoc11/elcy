import { Queryable } from "./Queryable";
import { ProjectionEntityExpression, SelectExpression, UnionExpression } from "./QueryExpression/index";

export class UnionQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type, parent.queryBuilder);
    }
    public execute(): SelectExpression<T> {
        if (!this.expression) {
            const unionEntity = new UnionExpression(
                new ProjectionEntityExpression(new SelectExpression(this.parent.execute()), this.queryBuilder.newAlias()),
                new ProjectionEntityExpression(new SelectExpression(this.parent2.execute()), this.queryBuilder.newAlias()),
                this.isUnionAll);

            this.expression = unionEntity;
        }
        return this.expression;
    }
}
