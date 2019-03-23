import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { hashCode } from "../Helper/Util";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { IQueryExpression } from "./QueryExpression/IQueryStatementExpression";
import { ParameterQueryable } from "./ParameterQueryable";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class TakeQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, new ParameterQueryable(parent, { take: quantity }));
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "take", [new ParameterExpression("take", Number)]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("TAKE", this.parent.hashCode());
    }
}
