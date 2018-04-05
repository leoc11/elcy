import { OrderDirection, ValueType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class OrderQueryable<T> extends Queryable<T> {
    protected readonly selectorFn: (item: T) => ValueType;
    protected _selector: FunctionExpression<T, ValueType>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionFactory.prototype.ToExpression(this.selectorFn, this.parent.type);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<T>, selector: FunctionExpression<T, ValueType> | ((item: T) => ValueType), protected readonly direction: OrderDirection) {
        super(parent.type);
        if (selector instanceof FunctionExpression)
            this.selector = selector;
        else
            this.selectorFn = selector;
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "orderBy", [this.selector]);
            const visitParam = { parent: objectOperand, type: "orderBy" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
    public getHashCode() {
        return this.parent.getHashCode() + "-OB" + Array.from((this.selectorFn || this.selector).toString()).sum((o) => o.charCodeAt(0));
    }
}
