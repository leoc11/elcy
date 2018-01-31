import { MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class ExceptQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            const objectOperand = new SelectExpression<any>(this.parent.buildQuery(queryBuilder) as any);
            const childOperand = new SelectExpression<any>(this.parent2.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(objectOperand, "except", [childOperand]);
            const visitParam = { parent: objectOperand, type: "except" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
}
