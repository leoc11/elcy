import { QueryType } from "../../Common/Enum";
import { DbContext } from "../../Data/DbContext";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryResultParser } from "../IQueryResultParser";
import { IQueryResultsParser } from "../IQueryResultsParser";
import { IQueryVisitor } from "../IQueryVisitor";
import { IQueryVisitParameter } from "../IQueryVisitParameter";
import { DQLDeferredQuery } from "./DQLDeferredQuery";

export class ToMapDeferredQuery<T, K, V> extends DQLDeferredQuery<Map<K, V>> {
    protected get valueSelector() {
        if (!this._valueSelector && this._valueSelectorFn) {
            this._valueSelector = ExpressionBuilder.parse(this._valueSelectorFn, [this.queryable.type], this.queryable.stackTree.node);
        }
        return this._valueSelector;
    }
    protected set valueSelector(value) {
        this._valueSelector = value;
    }
    protected get keySelector() {
        if (!this._keySelector && this._keySelectorFn) {
            this._keySelector = ExpressionBuilder.parse(this._keySelectorFn, [this.queryable.type], this.queryable.stackTree.node);
        }
        return this._keySelector;
    }
    protected set keySelector(value) {
        this._keySelector = value;
    }
    constructor(queryable: Queryable<T>,
                keySelector: FunctionExpression<K> | ((item: T) => K),
                valueSelector: FunctionExpression<V> | ((item: T) => V)) {
        super(queryable);
        if (keySelector instanceof FunctionExpression) {
            this.keySelector = keySelector;
        }
        else {
            this._keySelectorFn = keySelector;
        }
        if (valueSelector instanceof FunctionExpression) {
            this.valueSelector = valueSelector;
        }
        else {
            this._valueSelectorFn = valueSelector;
        }
    }
    private _keySelectorFn: (item: unknown) => K;
    private _keySelector: FunctionExpression<K>;
    private readonly _valueSelectorFn: (item: unknown) => V;
    private _valueSelector: FunctionExpression<V>;
    protected getResultParser(queryExp: QueryExpression<T>): IQueryResultsParser<Map<K, V>> {
        const parser: IQueryResultParser<{ Key: K, Value: V }> = this.dbContext.getQueryResultParser(queryExp, this.dbContext.queryBuilder);
        return (result: IQueryResult[], queries, dbContext: DbContext) => {
            let i = 0;
            result = result.where(() => queries[i++].type === QueryType.DQL).toArray();
            return parser.parse(result, dbContext).toMap((o) => o.Key, (o) => o.Value);
        };
    }
    protected buildQuery(visitor: IQueryVisitor) {
        const commandQuery = this.queryable.buildQuery(visitor) as unknown as SelectExpression<T>;

        const paramExp = new ParameterExpression("m");
        const selector = new ObjectValueExpression<{ Key: K, Value: V }>({});
        const keyExp = this.keySelector;
        const valueExp = this.valueSelector;
        keyExp.params[0].name = valueExp.params[0].name = paramExp.name;
        selector.object.Key = keyExp.body;
        selector.object.Value = valueExp.body;
        const selectorExp = new FunctionExpression(selector, [paramExp]);

        const methodExpression = new MethodCallExpression(commandQuery, "select", [selectorExp]);
        const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
        return visitor.visit(methodExpression, param) as QueryExpression<{ Key: K, Value: V }>;
    }
    protected getQueryCacheKey() {
        return hashCodeAdd(hashCode("MAP", super.getQueryCacheKey()), hashCodeAdd(this.keySelector.hashCode(), this.valueSelector.hashCode()));
    }
}
