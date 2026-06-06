import { JoinType } from "../Common/StringType";
import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitContext } from "../Query/IQueryVisitContext";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export abstract class JoinQueryable<T = unknown, T2 = unknown, R = unknown> extends Queryable<R> {
    public override get parameters() {
        if (!this._parameters) {
            this._parameters = {};
            Object.assign(this._parameters, this.parent2.parameters);
            Object.assign(this._parameters, this.parent.parameters);
        }
        return this._parameters;
    }
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
            this._resultSelector = ExpressionBuilder.parse(this.resultSelectorFn, [this.parent.type, this.parent2.type], this.parameters);
        }
        return this._resultSelector;
    }
    protected set resultSelector(value) {
        this._resultSelector = value;
    }
    constructor(protected joinType: JoinType, protected override readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<R, [T | null, T2 | null]> | ((item1: T | null, item2: T2 | null) => R), public override type: IObjectType<R> | ObjectConstructor = Object) {
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
    protected readonly relationFn: (item: T, item2: T2) => boolean;
    protected readonly resultSelectorFn: (item1: T | null, item2: T2 | null) => R;
    private _parameters: { [key: string]: any };
    private _relation: FunctionExpression<boolean, [T, T2]>;
    private _resultSelector: FunctionExpression<R, [T | null, T2 | null]>;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<R> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const childOperand = this.parent2.buildQuery(queryVisitor) as SelectExpression<object, T2>;
        const type = this.joinType.toLowerCase() + "Join";
        const params: IExpression[] = [childOperand];
        if (this.joinType !== "CROSS") {
            params.push(this.relation);
        }
        params.push(this.resultSelector);
        const methodExpression = new MethodCallExpression(objectOperand, type as any, params);
        const context: IQueryVisitContext = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, context) as any;
    }
    public override flatQueryParameter(param?: { index: number }) {
        const flatParam = this.parent.flatQueryParameter(param);
        const flatParam2 = this.parent2.flatQueryParameter(param);
        Object.assign(flatParam, flatParam2);
        return flatParam;
    }
}
