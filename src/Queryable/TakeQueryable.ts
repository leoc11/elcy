import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class TakeQueryable<T> extends Queryable<T> {
    constructor(parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent.parameter({ take: quantity }));
    }
    public expression: SelectExpression<T>;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<T[]> {
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "take", [new ParameterExpression("take", Number)]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return visitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("TAKE", this.parent.hashCode());
    }
}
