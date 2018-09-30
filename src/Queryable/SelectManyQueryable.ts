import { GenericType } from "../Common/Type";
import { Queryable } from "./Queryable";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryCommandExpression } from "./QueryExpression/IQueryCommandExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class SelectManyQueryable<S, T> extends Queryable<T> {
    protected readonly selectorFn: ((item: S) => T[] | Queryable<T>);
    protected _selector: FunctionExpression<S, T[] | Queryable<T>>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionBuilder.parse<S, T[] | Queryable<T>>(this.selectorFn);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<S>, selector: FunctionExpression<S, T[] | Queryable<T>> | ((item: S) => T[] | Queryable<T>), public type: GenericType<T> = Object) {
        super(type, parent);
        if (selector instanceof FunctionExpression)
            this.selector = selector;
        else
            this.selectorFn = selector;
    }
    public buildQuery(queryVisitor: QueryVisitor): IQueryCommandExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<S>;
        const methodExpression = new MethodCallExpression(objectOperand, "selectMany", [this.selector]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = queryVisitor.visit(methodExpression, visitParam) as SelectExpression;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCode("SELECTMANY", this.parent.hashCode() + hashCode((this.selectorFn || this.selector).toString()));
    }
}
