import { Enumerable } from "@elcy/enumerable";
import { IObjectType, MethodKey } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Hash";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitContext } from "../Query/IQueryVisitContext";
import { Queryable } from "./Queryable.internal";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class GroupJoinQueryable<T = any, T2 = any, R = any> extends Queryable<R> {
    protected get relation() {
        if (!this._relation && this.relationFn) {
            this._relation = ExpressionBuilder.parse(this.relationFn, [this.parent.type, this.parent2.type], this.parameters);
        }
        return this._relation;
    }
    protected set relation(value) {
        this._relation = value;
    }
    protected get resultSelector() {
        if (!this._resultSelector && this.resultSelectorFn) {
            this._resultSelector = ExpressionBuilder.parse(this.resultSelectorFn, [this.parent.type, Enumerable], this.parameters);
        }
        return this._resultSelector;
    }
    protected set resultSelector(value) {
        this._resultSelector = value;
    }
    constructor(public override readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relationShip: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<R, [T, Enumerable<T2>]> | ((item1: T, item2: Enumerable<T2>) => R), type: IObjectType<R> = Object as unknown as IObjectType<R>) {
        super(type, parent);
        this.option(this.parent2.queryOption);
        if (relationShip instanceof FunctionExpression) {
            this.relation = relationShip;
        }
        else {
            this.relationFn = relationShip;
        }

        if (resultSelector) {
            if (resultSelector instanceof FunctionExpression) {
                this.resultSelector = resultSelector;
            }
            else {
                this.resultSelectorFn = resultSelector;
            }
        }
    }
    protected readonly relationFn: (item: T, item2: T2) => boolean;
    protected readonly resultSelectorFn: (item1: T, item2: Enumerable<T2>) => R;
    private _relation: FunctionExpression<boolean, [T, T2]>;
    private _resultSelector: FunctionExpression<R, [T, Enumerable<T2>]>;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<R> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const childOperand = this.parent2.buildQuery(queryVisitor) as SelectExpression<object, T2>;
        const methodExpression = new MethodCallExpression(objectOperand, "groupJoin" as MethodKey<T[]>, [childOperand, this.relation, this.resultSelector]);
        const context: IQueryVisitContext = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, context) as any;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("GROUPJOIN", this.parent.hashCode()), this.parent2.hashCode());
    }
}
