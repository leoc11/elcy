import { FunctionExpression, MethodCallExpression } from "../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";

export class DistinctQueryable<T> extends Queryable<T> {
    protected readonly selectorFn?: (item: T) => any;
    private _selector?: FunctionExpression<T, any>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionBuilder.parse(this.selectorFn, [this.parent.type]);
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
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "distinct" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("DISTINCT") + hashCode((this.selectorFn || this.selector || "").toString());
    }
}
