import { IEnumerable } from "@elcy/enumerable";
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
            this._selector = ExpressionBuilder.parse(this.selectorFn, [this.parent.type], this.parameters);
        }
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public override readonly parent: Queryable<S>, selector: FunctionExpression<IEnumerable<T>, [S]> | ((item: S) => IEnumerable<T>), type: GenericType<T> = Object) {
        super(type, parent);
        if (selector instanceof FunctionExpression) {
            this.selector = selector;
        }
        else {
            this.selectorFn = selector;
        }
    }
    protected _selector: FunctionExpression<IEnumerable<T>, [S]>;
    protected readonly selectorFn: ((item: S) => IEnumerable<T>);
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<S & object>;
        const methodExpression = new MethodCallExpression(objectOperand, "flatMap", [this.selector.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = queryVisitor.visit(methodExpression, visitParam) as SelectExpression;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("FLATMAP", this.parent.hashCode()), this.selector.hashCode());
    }
}
