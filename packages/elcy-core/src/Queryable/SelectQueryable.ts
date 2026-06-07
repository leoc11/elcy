import { GenericType, PrimitiveType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Hash";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitContext } from "../Query/IQueryVisitContext";
import { Queryable } from "./Queryable.internal";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class SelectQueryable<S, T> extends Queryable<T> {
    protected get selector() {
        if (!this._selector && this.selectorFn) {
            this._selector = ExpressionBuilder.parse(this.selectorFn, [this.parent.type], this.parameters);
        }
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(parent: Queryable<S>, selector: ((item: S) => T) | FunctionExpression<T, [S]>, type?: PrimitiveType<T>);
    constructor(parent: Queryable<S>, selector: ((item: S) => T) | FunctionExpression<T, [S]>, type?: GenericType<T>);
    constructor(public override readonly parent: Queryable<S>, selector: ((item: S) => T) | FunctionExpression<T, [S]>, type: GenericType<T> = Object) {
        super(type, parent as Queryable);
        if (selector instanceof FunctionExpression) {
            this.selector = selector;
        }
        else {
            this.selectorFn = selector;
        }
    }
    protected _selector: FunctionExpression<T, [S]>;
    protected readonly selectorFn: (item: S) => T;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, S>;
        const params: IExpression[] = [this.selector];
        if (this.type !== Object) {
            params.push(new ValueExpression(this.type));
        }
        const methodExpression = new MethodCallExpression(objectOperand, "map", params);
        const context: IQueryVisitContext = { selectExpression: objectOperand, scope: "queryable" };
        const result = queryVisitor.visit(methodExpression, context) as SelectExpression<object, T>;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("MAP", this.parent.hashCode()), this.selector.hashCode());
    }
}
