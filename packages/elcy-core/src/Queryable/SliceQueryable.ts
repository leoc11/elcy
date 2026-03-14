import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class SliceQueryable<T> extends Queryable<T> {
    constructor(parent: Queryable<T>, protected readonly start: number, protected readonly end?: number) {
        const parentParam = parent.parameter({ skip: start, take: typeof end === "number" ? end - start : undefined });
        super(parent.type, parentParam as Queryable);
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const parameterExps = [new ParameterExpression<number>("skip", Number)];
        if (typeof this.end === "number") {
            parameterExps.push(new ParameterExpression<number>("take", Number));
        }
        const methodExpression = new MethodCallExpression(objectOperand, "slice", parameterExps);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as IQueryExpression<T>;
    }
    public hashCode() {
        return hashCode("SLICE", this.parent.hashCode());
    }
}
