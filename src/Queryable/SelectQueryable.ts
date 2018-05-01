import { GenericType } from "../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";

export class SelectQueryable<S, T> extends Queryable<T> {
    protected readonly selectorFn: (item: S) => T;
    protected _selector: FunctionExpression<S, T>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionBuilder.parse(this.selectorFn, [this.parent.type], this.parameters);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<S>, selector: ((item: S) => T) | FunctionExpression<S, T>, public type: GenericType<T> = Object) {
        super(type);
        this.setParameters(this.parent.parameters);
        if (selector instanceof FunctionExpression)
            this.selector = selector;
        else
            this.selectorFn = selector;
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "select", [this.selector]);
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "select" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("SELECT") + hashCode((this.selectorFn || this.selector).toString());
    }
}
