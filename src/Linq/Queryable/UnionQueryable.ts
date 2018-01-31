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
            const objectOperand = new SelectExpression<any>(this.parent.buildQuery(queryBuilder) as any);
            const childOperand = new SelectExpression<any>(this.parent2.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(objectOperand, "union", [childOperand, new ValueExpression(this.isUnionAll)]);
            const visitParam = { parent: objectOperand, type: "union" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
}
