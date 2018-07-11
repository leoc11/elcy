import { GenericType } from "../Common/Type";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";

export class IncludeQueryable<T> extends Queryable<T> {
    protected readonly selectorsFn: Array<(item: T) => any>;
    private _selectors: Array<FunctionExpression<T, any>>;
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.select((o) => ExpressionBuilder.parse(o, [this.parent.type])).toArray();
        }

        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, selectors: Array<((item: T) => any)> | Array<FunctionExpression<T, any>>, public type: GenericType<T> = Object) {
        super(type, parent);
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
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "queryable" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
    public hashCode(): number {
        return this.parent.hashCode() + hashCode("INCLUDE") + ((this.selectorsFn || this.selectors) as any[])
            .select((o) => hashCode(o.toString()))
            .sum();
    }
}
