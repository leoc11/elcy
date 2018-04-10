import { MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";
import { IQueryVisitParameter } from "../QueryExpressionVisitor";

export class IntersectQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            if (!this.expression) {
                const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
                const childOperand = this.parent2.buildQuery(queryBuilder).clone() as SelectExpression;
                const methodExpression = new MethodCallExpression(objectOperand, "intersect", [childOperand]);
                const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "intersect" };
                this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
            }
        }
        return this.expression as any;
    }
    public getHashCode() {
        return this.parent.getHashCode() + "-IN-" + this.parent2.getHashCode();
    }
}
