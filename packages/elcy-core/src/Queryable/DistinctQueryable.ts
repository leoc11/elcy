import { MethodKey } from "src/Common/Type";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { hashCode } from "../Helper/Hash";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitContext } from "../Query/IQueryVisitContext";
import { Queryable } from "./Queryable.internal";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class DistinctQueryable<T> extends Queryable<T> {
    constructor(protected override readonly parent: Queryable<T>) {
        super(parent.type, parent);
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const methodExpression = new MethodCallExpression<T[]>(objectOperand, "distinct" as MethodKey<[]>, []);
        const context: IQueryVisitContext = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, context) as IQueryExpression<T>;
    }
    public hashCode() {
        return hashCode("DISTINCT", this.parent.hashCode());
    }
}
