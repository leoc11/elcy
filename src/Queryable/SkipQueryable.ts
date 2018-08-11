import { Queryable } from "./Queryable";
import { hashCode } from "../Helper/Util";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { ParameterQueryable } from "./ParameterQueryable";

export class SkipQueryable<T> extends Queryable<T> {
    constructor(parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, new ParameterQueryable(parent, { skip: quantity }));
    }
    public buildQuery(queryVisitor: QueryVisitor): ICommandQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "skip", [new ParameterExpression("skip", Number)]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("SKIP", this.parent.hashCode());
    }
}
