import { Queryable } from "./Queryable";
import { hashCode } from "../Helper/Util";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { ParameterQueryable } from "./ParameterQueryable";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class SkipQueryable<T> extends Queryable<T> {
    constructor(parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, new ParameterQueryable(parent, { skip: quantity }));
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "skip", [new ParameterExpression("skip", Number)]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("SKIP", this.parent.hashCode());
    }
}
