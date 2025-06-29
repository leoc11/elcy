import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class SkipQueryable<T> extends Queryable<T> {
    constructor(parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent.parameter({ skip: quantity}));
    }
    protected override parent: Queryable<T>;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const methodExpression = new MethodCallExpression(objectOperand, "skip", [new ParameterExpression<number>("skip", Number)]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as unknown as IQueryExpression<T>;
    }
    public hashCode() {
        return hashCode("SKIP", this.parent.hashCode());
    }
}
