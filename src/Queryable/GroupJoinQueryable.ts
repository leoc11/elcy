import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class GroupJoinQueryable<T = any, T2 = any, R = any> extends Queryable<R> {
    protected get relation() {
        if (!this._relation && this.relationFn) {
            this._relation = ExpressionBuilder.parse<boolean>(this.relationFn, [this.parent.type, this.parent2.type], this.stackTree.node);
        }
        return this._relation;
    }
    protected set relation(value) {
        this._relation = value;
    }
    protected get resultSelector() {
        if (!this._resultSelector && this.resultSelectorFn) {
            this._resultSelector = ExpressionBuilder.parse<any>(this.resultSelectorFn, [this.parent.type, this.parent2.type], this.stackTree.node);
        }
        return this._resultSelector;
    }
    protected set resultSelector(value) {
        this._resultSelector = value;
    }
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relationShip: FunctionExpression<boolean> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<R> | ((item1: T, item2: T2[]) => R), public type: IObjectType<R> = Object as any) {
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
    protected readonly resultSelectorFn: (item1: T, item2: T2[]) => R;
    private _relation: FunctionExpression<boolean>;
    private _resultSelector: FunctionExpression<R>;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<R[]> {
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<T>;
        const childOperand = this.parent2.buildQuery(visitor) as SelectExpression<T2>;
        const methodExpression = new MethodCallExpression(objectOperand, "groupJoin", [childOperand, this.relation.clone(), this.resultSelector.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return visitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("GROUPJOIN", this.parent.hashCode()), this.parent2.hashCode());
    }
}
