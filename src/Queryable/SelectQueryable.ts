import { GenericType, IObjectType, ResultSelector } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { toObjectFunctionExpression } from "../Helper/ExpressionUtil";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class SelectQueryable<S, T> extends Queryable<T> {
    protected get selector() {
        if (!this._selector && this.selectorFn) {
            if (this.selectorFn instanceof Function) {
                this._selector = ExpressionBuilder.parse(this.selectorFn, [this.parent.type], this.stackTree.node);
            }
            else {
                this._selector = toObjectFunctionExpression(this.selectorFn as any, this.parent.type as IObjectType, "o", this.stackTree.node, this.type as IObjectType);
            }
        }
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<S>, selector: ResultSelector<S, T>, public type: GenericType<T> = Object) {
        super(type, parent);
        if (selector instanceof FunctionExpression) {
            this.selector = selector;
        }
        else {
            this.selectorFn = selector;
        }
    }
    protected _selector: FunctionExpression<T>;
    protected readonly selectorFn: ResultSelector<S, T>;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<T[]> {
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<S>;
        const params: IExpression[] = [this.selector.clone()];
        if (this.type !== Object) {
            params.unshift(new ValueExpression(this.type));
        }
        const methodExpression = new MethodCallExpression(objectOperand, "select", params);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = visitor.visit(methodExpression, visitParam) as SelectExpression;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("SELECT", this.parent.hashCode()), this.selector.hashCode());
    }
}
