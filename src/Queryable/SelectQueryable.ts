import { GenericType } from "../Common/Type";
import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class SelectQueryable<S, T> extends Queryable<T> {
    protected readonly selectorFn: (item: S) => T;
    protected _selector: FunctionExpression<T>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionBuilder.parse(this.selectorFn, this.parameters);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<S>, selector: ((item: S) => T) | FunctionExpression<T>, public type: GenericType<T> = Object) {
        super(type, parent);
        if (selector instanceof FunctionExpression)
            this.selector = selector;
        else
            this.selectorFn = selector;
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<S>;
        const params: IExpression[] = [this.selector];
        if (this.type !== Object) params.unshift(new ValueExpression(this.type));
        const methodExpression = new MethodCallExpression(objectOperand, "select", params);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = queryVisitor.visit(methodExpression, visitParam) as SelectExpression;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("SELECT", this.parent.hashCode()), this.selector.hashCode());
    }
}
