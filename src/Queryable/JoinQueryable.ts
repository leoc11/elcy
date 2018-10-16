import { IObjectType, JoinType } from "../Common/Type";
import { Queryable } from "./Queryable";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryCommandExpression } from "./QueryExpression/IQueryCommandExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export abstract class JoinQueryable<T = any, T2 = any, R = any> extends Queryable<R> {
    protected readonly relationFn: (item: T, item2: T2) => boolean;
    protected readonly resultSelectorFn: (item1: T | null, item2: T2 | null) => R;
    private _relation: FunctionExpression<boolean>;
    protected get relation() {
        if (!this._relation && this.relationFn)
            this._relation = ExpressionBuilder.parse<boolean>(this.relationFn, this.flatParameterStacks);
        return this._relation;
    }
    protected set relation(value) {
        this._relation = value;
    }
    private _resultSelector: FunctionExpression<R>;
    protected get resultSelector() {
        if (!this._resultSelector && this.resultSelectorFn)
            this._resultSelector = ExpressionBuilder.parse(this.resultSelectorFn, this.flatParameterStacks);
        return this._resultSelector;
    }
    protected set resultSelector(value) {
        this._resultSelector = value;
    }
    constructor(protected joinType: JoinType, public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relation: FunctionExpression<boolean> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<R> | ((item1: T | null, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(type, parent);
        this.option(this.parent2.queryOption);
        if (relation instanceof FunctionExpression)
            this.relation = relation;
        else
            this.relationFn = relation;

        if (resultSelector) {
            if (resultSelector instanceof FunctionExpression)
                this.resultSelector = resultSelector;
            else
                this.resultSelectorFn = resultSelector;
        }
    }
    public buildQuery(queryVisitor: QueryVisitor): IQueryCommandExpression<R> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const childOperand = this.parent2.buildQuery(queryVisitor) as SelectExpression<T2>;
        const type = this.joinType.toLowerCase() + "Join";
        const methodExpression = new MethodCallExpression(objectOperand, type, [childOperand, this.relation, this.resultSelector]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
}
