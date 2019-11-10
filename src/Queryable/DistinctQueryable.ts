import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class DistinctQueryable<T> extends Queryable<T> {
    protected get selector() {
        if (!this._selector && this.selectorFn) {
            this._selector = ExpressionBuilder.parse(this.selectorFn, [this.parent.type], this.stackTree.node);
        }
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<T>) {
        super(parent.type, parent);
    }
    protected readonly selectorFn?: (item: T) => any;
    private _selector?: FunctionExpression;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<T[]> {
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<T>;
        const params = [];
        if (this.selector) {
            params.push(this.selector.clone());
        }
        const methodExpression = new MethodCallExpression(objectOperand, "distinct", params);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return visitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("DISTINCT", this.parent.hashCode()), this.selector ? this.selector.hashCode() : 0);
    }
}
