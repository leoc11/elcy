import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";

export class GroupByQueryable<K, T> extends Queryable<GroupedEnumerable<K, T>> {
    protected readonly keySelectorFn: (item: T) => K;
    private _keySelector: FunctionExpression;
    protected get keySelector() {
        if (!this._keySelector && this.keySelectorFn)
            this._keySelector = ExpressionBuilder.parse(this.keySelectorFn, this.flatParameterStacks);
        return this._keySelector;
    }
    protected set keySelector(value) {
        this._keySelector = value;
    }
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<K> | ((item: T) => K)) {
        super(Array as any, parent);
        if (keySelector instanceof FunctionExpression)
            this.keySelector = keySelector;
        else
            this.keySelectorFn = keySelector;
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<GroupedEnumerable<K, T>> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "groupBy", [this.keySelector.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = queryVisitor.visit(methodExpression, visitParam) as SelectExpression;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("GROUPBY", this.parent.hashCode()), this.keySelector ? this.keySelector.hashCode() : 0);
    }
}
