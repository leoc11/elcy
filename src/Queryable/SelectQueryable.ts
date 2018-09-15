import { GenericType } from "../Common/Type";
import { Queryable } from "./Queryable";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryCommandExpression } from "./QueryExpression/IQueryCommandExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class SelectQueryable<S, T> extends Queryable<T> {
    protected readonly selectorFn: (item: S) => T;
    protected _selector: FunctionExpression<S, T>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionBuilder.parse(this.selectorFn, this.parameters);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<S>, selector: ((item: S) => T) | FunctionExpression<S, T>, public type: GenericType<T> = Object) {
        super(type, parent);
        if (selector instanceof FunctionExpression)
            this.selector = selector;
        else
            this.selectorFn = selector;
    }
    public buildQuery(queryVisitor: QueryVisitor): IQueryCommandExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<S>;
        const methodExpression = new MethodCallExpression(objectOperand, "select", [this.selector]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("SELECT", this.parent.hashCode() + hashCode((this.selectorFn || this.selector).toString()));
    }
}
