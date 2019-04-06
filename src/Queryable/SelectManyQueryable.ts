import { GenericType } from "../Common/Type";
import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class SelectManyQueryable<S, T> extends Queryable<T> {
    protected readonly selectorFn: ((item: S) => T[] | Queryable<T>);
    protected _selector: FunctionExpression<T[] | Queryable<T>>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionBuilder.parse<T[] | Queryable<T>>(this.selectorFn);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<S>, selector: FunctionExpression<T[] | Queryable<T>> | ((item: S) => T[] | Queryable<T>), public type: GenericType<T> = Object) {
        super(type, parent);
        if (selector instanceof FunctionExpression)
            this.selector = selector;
        else
            this.selectorFn = selector;
    }
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
