import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { Queryable } from "./Queryable";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { hashCode } from "../Helper/Util";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IQueryCommandExpression } from "./QueryExpression/IQueryCommandExpression";

export class IntersectQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type, parent);
        this.option(this.parent2.option);
    }
    public buildQuery(queryVisitor: QueryVisitor): IQueryCommandExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const childOperand = this.parent2.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "intersect", [childOperand]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return  queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("INTERSECT", this.parent.hashCode() + this.parent2.hashCode());
    }
}
