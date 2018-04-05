import { GenericType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class IncludeQueryable<T> extends Queryable<T> {
    protected readonly selectorsFn: Array<(item: T) => any>;
    private _selectors: Array<FunctionExpression<T, any>>;
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.select((o) => ExpressionFactory.prototype.ToExpression<T, any>(o, this.parent.type)).toArray();
        }

        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, selectors: Array<((item: T) => any)> | Array<FunctionExpression<T, any>>, public type: GenericType<T> = Object) {
        super(type);
        if (selectors.length > 0 && selectors[0] instanceof FunctionExpression) {
            this.selectors = selectors as any;
        }
        else {
            this.selectorsFn = selectors as any;
        }
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "include", this.selectors);
            const visitParam = { parent: objectOperand, type: "include" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
    public getHashCode(): string {
        return this.parent.getHashCode() + "-IC" + (this.selectorsFn || this.selectors)
            .select((o) => Array.from(o.toString()).sum((c) => c.charCodeAt(0)))
            .sum();
    }
}
