import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class GroupByQueryable<T, K> extends Queryable<GroupedEnumerable<T, K>> {
    public expression: SelectExpression<GroupedEnumerable<T, K>>;
    protected readonly keySelectorFn: (item: T) => K;
    private _keySelector?: FunctionExpression<T, any>;
    protected get keySelector() {
        if (!this._keySelector && this.selectorFn)
            this._keySelector = ExpressionFactory.prototype.ToExpression(this.selectorFn, this.parent.type);
        return this._keySelector;
    }
    protected set keySelector(value) {
        this._keySelector = value;
    }
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(Array as any);
        if (keySelector instanceof FunctionExpression)
            this.keySelector = keySelector;
        else
            this.keySelectorFn = key;
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<GroupedEnumerable<T, K>> {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "groupBy", [this.keySelector]);
            const visitParam = { parent: objectOperand, type: "groupBy" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
    public getHashCode() {
        return this.parent.getHashCode() + "-GB" + Array.from((this.keySelectorFn || this.keySelector).toString()).sum((o) => o.charCodeAt(0));
    }
}
