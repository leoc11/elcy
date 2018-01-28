import { MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class IntersectQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            if (!this.expression) {
                queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
                const select1 = new SelectExpression<any>(this.parent.buildQuery(queryBuilder) as any);
                const select2 = new SelectExpression<any>(this.parent2.buildQuery(queryBuilder) as any);
                const methodExpression = new MethodCallExpression(select1.entity, "intersect", [select2]);
                const param = { parent: select1, type: methodExpression.methodName };
                queryBuilder.visit(methodExpression, param as any);
                this.expression = param.parent;
            }
        }
        return this.expression as any;
    }
}
