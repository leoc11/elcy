import { MethodCallExpression } from "../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";

export class IntersectQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type);
        this.setParameters(this.parent.parameters);
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
    public hashCode() {
        return this.parent.hashCode() + hashCode("INTERSECT") + this.parent2.hashCode();
    }
}