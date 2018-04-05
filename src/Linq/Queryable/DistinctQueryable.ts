import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";

export class DistinctQueryable<T> extends Queryable<T> {
    protected readonly selectorFn?: (item: T) => any;
    private _selector?: FunctionExpression<T, any>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionFactory.prototype.ToExpression<T, any>(this.selectorFn, this.parent.type);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<T>) {
        super(parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): any {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodParams = [];
            if (this.selector)
                methodParams.push(this.selector);

            const methodExpression = new MethodCallExpression(objectOperand, "distinct", methodParams);
            const visitParam = { parent: objectOperand, type: "distinct" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
    public getHashCode(): string {
        return this.parent.getHashCode() + "-DI" + Array.from((this.selectorFn || this.selector || "").toString()).sum((c) => c.charCodeAt(0));;
    }
}
