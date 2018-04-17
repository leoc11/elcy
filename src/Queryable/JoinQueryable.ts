import { IObjectType, JoinType, ValueType } from "../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../ExpressionBuilder/Expression";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";

export abstract class JoinQueryable<T = any, T2 = any, K extends ValueType = any, R = any> extends Queryable<R> {
    public expression: SelectExpression<R>;
    protected readonly keySelector1Fn: (intem: T) => K;
    protected readonly keySelector2Fn: (item: T2) => K;
    protected readonly resultSelectorFn: (item1: T | null, item2: T2 | null) => R;
    private _keySelector1: FunctionExpression<T, K>;
    protected get keySelector1() {
        if (!this._keySelector1 && this.keySelector1Fn)
            this._keySelector1 = ExpressionBuilder.parse(this.keySelector1Fn, [this.parent.type]);
        return this._keySelector1;
    }
    protected set keySelector1(value) {
        this._keySelector1 = value;
    }
    private _keySelector2: FunctionExpression<T2, K>;
    protected get keySelector2() {
        if (!this._keySelector2 && this.keySelector1Fn)
            this._keySelector2 = ExpressionBuilder.parse(this.keySelector2Fn, [this.parent2.type]);
        return this._keySelector2;
    }
    protected set keySelector2(value) {
        this._keySelector2 = value;
    }
    private _resultSelector: FunctionExpression<T | T2, R>;
    protected get resultSelector() {
        if (!this._resultSelector && this.resultSelectorFn)
            this._resultSelector = ExpressionBuilder.parse<T | T2, any>(this.resultSelectorFn, [this.parent.type, this.parent2.type]);
        return this._resultSelector;
    }
    protected set resultSelector(value) {
        this._resultSelector = value;
    }
    constructor(protected joinType: JoinType, public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<any, R> | ((item1: T | null, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(type);
        this.setParameters(this.parent.parameters);
        if (keySelector1 instanceof FunctionExpression)
            this.keySelector1 = keySelector1;
        else
            this.keySelector1Fn = keySelector1;

        if (keySelector2 instanceof FunctionExpression)
            this.keySelector2 = keySelector2;
        else
            this.keySelector2Fn = keySelector2;

        if (resultSelector) {
            if (resultSelector instanceof FunctionExpression)
                this.resultSelector = resultSelector;
            else
                this.resultSelectorFn = resultSelector;
        }
    }
    public buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<R> {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const childOperand = this.parent2.buildQuery(queryBuilder).clone() as SelectExpression;
            const type = this.joinType.toLowerCase() + "Join";
            const methodExpression = new MethodCallExpression(objectOperand, type, [childOperand, this.keySelector1, this.keySelector2, this.resultSelector]);
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: type };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
}
