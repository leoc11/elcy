import { IObjectType, JoinType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export abstract class JoinQueryable<T = any, T2 = any, R = any> extends Queryable<R> {
    protected readonly relationFn: (item: T, item2: T2) => boolean;
    protected readonly resultSelectorFn: (item1: T | null, item2: T2 | null) => R;
    private _relation: FunctionExpression<boolean>;
    protected get relation() {
        if (!this._relation && this.relationFn) {
            this._relation = ExpressionBuilder.parse<boolean>(this.relationFn, [this.parent.type, this.parent2.type], this.parameters);
        }
        return this._relation;
    }
    protected set relation(value) {
        this._relation = value;
    }
    private _resultSelector: FunctionExpression<R>;
    protected get resultSelector() {
        if (!this._resultSelector && this.resultSelectorFn) {
            this._resultSelector = ExpressionBuilder.parse(this.resultSelectorFn, [this.parent.type, this.parent2.type], this.parameters);
        }
        return this._resultSelector;
    }
    protected set resultSelector(value) {
        this._resultSelector = value;
    }
    public get parameters() {
        if (!this._parameters) {
            this._parameters = {};
            Object.assign(this._parameters, this.parent2.parameters);
            Object.assign(this._parameters, this.parent.parameters);
        }
        return this._parameters;
    }
    private _parameters: { [key: string]: any };
    constructor(protected joinType: JoinType, parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relation: FunctionExpression<boolean> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<R> | ((item1: T | null, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(type, parent);
        this.option(this.parent2.queryOption);
        if (relation instanceof FunctionExpression) {
            this.relation = relation;
        }
        else {
            this.relationFn = relation;
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
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<R> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const childOperand = this.parent2.buildQuery(queryVisitor) as SelectExpression<T2>;
        const type = this.joinType.toLowerCase() + "Join";
        const params: IExpression[] = [childOperand];
        if (this.joinType !== "CROSS") { params.push(this.relation.clone()); }
        params.push(this.resultSelector.clone());
        const methodExpression = new MethodCallExpression(objectOperand, type as any, params);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public flatQueryParameter(param?: { index: number }) {
        const flatParam = this.parent.flatQueryParameter(param);
        const flatParam2 = this.parent2.flatQueryParameter(param);
        Object.assign(flatParam, flatParam2);
        return flatParam;
    }
}
