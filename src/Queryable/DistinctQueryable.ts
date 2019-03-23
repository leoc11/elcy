import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryExpression } from "./QueryExpression/IQueryStatementExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class DistinctQueryable<T> extends Queryable<T> {
    protected readonly selectorFn?: (item: T) => any;
    private _selector?: FunctionExpression;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionBuilder.parse(this.selectorFn, this.parameters);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<T>) {
        super(parent.type, parent);
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodParams = [];
        if (this.selector)
            methodParams.push(this.selector);

        const methodExpression = new MethodCallExpression(objectOperand, "distinct", methodParams);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("DISTINCT", this.parent.hashCode()), this.selector ? this.selector.hashCode() : 0);
    }
}
