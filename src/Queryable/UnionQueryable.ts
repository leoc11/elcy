import { MethodCallExpression, ValueExpression } from "../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";

export class UnionQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type);
        this.setParameters(this.parent.parameters);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const childOperand = this.parent2.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "union", [childOperand, new ValueExpression(this.isUnionAll)]);
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "queryable" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("UNION") + this.parent2.hashCode();
    }
}
