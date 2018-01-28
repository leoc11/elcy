import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { MethodCallExpression, ValueExpression } from "../../ExpressionBuilder/Expression/index";

export class UnionQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type);
    }
    public buildQuery(queryBuilder?: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            const select1 = new SelectExpression<any>(this.parent.buildQuery(queryBuilder) as any);
            const select2 = new SelectExpression<any>(this.parent2.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(select1.entity, "union", [select2, new ValueExpression(this.isUnionAll)]);
            const param = { parent: select1, type: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression;
    }
}
