import { FunctionExpression, MethodCallExpression } from "../ExpressionBuilder/Expression/index";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IGroupArray } from "../QueryBuilder/Interface/IGroupArray";

export class GroupByQueryable<T, K> extends Queryable<IGroupArray<T, K>> {
    public expression: SelectExpression<GroupedEnumerable<T, K>>;
    protected readonly keySelectorFn: (item: T) => K;
    private _keySelector: FunctionExpression<T, any>;
    protected get keySelector() {
        if (!this._keySelector && this.keySelectorFn)
            this._keySelector = ExpressionBuilder.parse(this.keySelectorFn, [this.parent.type]);
        return this._keySelector;
    }
    protected set keySelector(value) {
        this._keySelector = value;
    }
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(Array as any);
        this.setParameters(this.parent.parameters);
        if (keySelector instanceof FunctionExpression)
            this.keySelector = keySelector;
        else
            this.keySelectorFn = keySelector;
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<GroupedEnumerable<T, K>> {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "groupBy", [this.keySelector]);
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "queryable" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
    public hashCode() {
        return this.parent.hashCode() + hashCode("GROUPBY") + hashCode((this.keySelectorFn || this.keySelector || "").toString());
    }
}
