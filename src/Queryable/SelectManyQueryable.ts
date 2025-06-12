import { GenericType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class SelectManyQueryable<S, T> extends Queryable<T> {
    protected get selector() {
        if (!this._selector && this.selectorFn) {
            this._selector = ExpressionBuilder.parse<Iterable<T>>(this.selectorFn, [this.parent.type], this.parameters);
        }
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<S>, selector: FunctionExpression<Iterable<T>> | ((item: S) => Iterable<T>), public type: GenericType<T> = Object) {
        super(type, parent);
        if (selector instanceof FunctionExpression) {
            this.selector = selector;
        }
        else {
            this.selectorFn = selector;
        }
    }
    protected _selector: FunctionExpression<Iterable<T>>;
    protected readonly selectorFn: ((item: S) => Iterable<T>);
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<S>;
        const methodExpression = new MethodCallExpression(objectOperand, "selectMany", [this.selector.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = queryVisitor.visit(methodExpression, visitParam) as SelectExpression;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("SELECTMANY", this.parent.hashCode()), this.selector.hashCode());
    }
}
