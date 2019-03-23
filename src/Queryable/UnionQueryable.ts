import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { hashCode } from "../Helper/Util";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class UnionQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type, parent);
        this.flatParameterStacks[this.parameterName] = this.isUnionAll;
    }
    public get parameterName() {
        return "__union" + Math.abs(this.hashCode());
    }
    public buildQuery(queryVisitor: IQueryVisitor) {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const childOperand = this.parent2.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "union", [childOperand, new ParameterExpression(this.parameterName, Boolean)]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("UNION", this.parent.hashCode() + this.parent2.hashCode());
    }
}
