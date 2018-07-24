import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { hashCode } from "../Helper/Util";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";

export class SkipQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent);

        const obj: { [key: string]: any } = {};
        obj[this.parameterName] = this.quantity;
        this.parameter(obj);
    }
    public get parameterName() {
        return "__skip" + Math.abs(this.hashCode());
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        const objectOperand = this.parent.buildQuery(queryBuilder) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "skip", [new ParameterExpression(this.parameterName, Number)]);
        const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "queryable" };
        return queryBuilder.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("SKIP", this.parent.hashCode());
    }
}
