import { GenericType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";
import { IQueryVisitParameter } from "../QueryExpressionVisitor";
import { hashCode } from "../../Helper/Util";

export class SelectManyQueryable<S, T> extends Queryable<T> {
    protected readonly selectorFn: ((item: S) => T[] | Queryable<T>);
    protected _selector: FunctionExpression<S, T[] | Queryable<T>>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionFactory.prototype.ToExpression<S, T[] | Queryable<T>>(this.selectorFn, this.parent.type);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<S>, selector: FunctionExpression<S, T[] | Queryable<T>> | ((item: S) => T[] | Queryable<T>), public type: GenericType<T> = Object) {
        super(type);
        if (selector instanceof FunctionExpression)
            this.selector = selector;
        else
            this.selectorFn = selector;
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "selectMany", [this.selector]);
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "selectMany" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
    public getHashCode() {
        return this.parent.getHashCode() + "SM(" + hashCode((this.selectorFn || this.selector).toString()) + ")";
    }
}
