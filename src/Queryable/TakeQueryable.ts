import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { hashCode } from "../Helper/Util";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";

export class TakeQueryable<T> extends Queryable<T> {
    public expression: SelectExpression<T>;
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent);
        const obj: { [key: string]: any } = {};
        obj[this.parameterName] = this.quantity;
        this.parameter(obj);
    }
    public get parameterName() {
        return "__take" + Math.abs(this.hashCode());
    }
    public buildQuery(queryBuilder: QueryBuilder) {
        const objectOperand = this.parent.buildQuery(queryBuilder) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "take", [new ParameterExpression(this.parameterName, Number)]);
        const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "queryable" };
        return queryBuilder.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("TAKE", this.parent.hashCode());
    }
}
