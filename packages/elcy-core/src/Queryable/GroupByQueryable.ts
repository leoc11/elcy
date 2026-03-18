import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { GroupedEnumerable } from "@elcy/enumerable";

export class GroupByQueryable<K, T> extends Queryable<GroupedEnumerable<K, T>> {
    protected get keySelector() {
        if (!this._keySelector && this.keySelectorFn) {
            this._keySelector = ExpressionBuilder.parse(this.keySelectorFn, [this.parent.type], this.parameters);
        }
        return this._keySelector;
    }
    protected set keySelector(value) {
        this._keySelector = value;
    }
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<K> | ((item: T) => K)) {
        super(Array as any, parent);
        if (keySelector instanceof FunctionExpression) {
            this.keySelector = keySelector;
        }
        else {
            this.keySelectorFn = keySelector;
        }
    }
    protected readonly keySelectorFn: (item: T) => K;
    private _keySelector: FunctionExpression;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<GroupedEnumerable<K, T>> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "groupBy", [this.keySelector.clone()]);
        const visitParam: IQueryVisitParameter<T> = { selectExpression: objectOperand, scope: "queryable" };
        const result = queryVisitor.visit(methodExpression, visitParam) as SelectExpression;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("GROUPBY", this.parent.hashCode()), this.keySelector ? this.keySelector.hashCode() : 0);
    }
    override deferredToEnumerable(): DeferredQuery<Enumerable<GroupedEnumerable<K, T>>> {
        throw new Error("not supported");
    }
    override deferredToArray(): DeferredQuery<GroupedEnumerable<K, T>[]> {
        throw new Error("not supported");
    }
    override deferredToSet(): DeferredQuery<Set<GroupedEnumerable<K, T>>> {
        throw new Error("not supported");
    }
    override deferredToMap<K, V>(keySelector: (item: any) => K, valueSelector?: (item: any) => V): DeferredQuery<Map<K, V>> {
        throw new Error("not supported");
    }
}
