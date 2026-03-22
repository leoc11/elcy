import { MethodKey } from "src/Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IGroupArray } from "src/Common/IGroupArray";

export class GroupByQueryable<K, T> extends Queryable<IGroupArray<K, T>> {
    protected get keySelector() {
        if (!this._keySelector && this.keySelectorFn) {
            this._keySelector = ExpressionBuilder.parse(this.keySelectorFn, [this.parent.type], this.parameters);
        }
        return this._keySelector;
    }
    protected set keySelector(value) {
        this._keySelector = value;
    }
    constructor(public override readonly parent: Queryable<T>, keySelector: FunctionExpression<K, [T]> | ((item: T) => K)) {
        super(Array as any, parent);
        if (keySelector instanceof FunctionExpression) {
            this.keySelector = keySelector;
        }
        else {
            this.keySelectorFn = keySelector;
        }
    }
    protected readonly keySelectorFn: (item: T) => K;
    private _keySelector: FunctionExpression<K, [T]>;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<IGroupArray<K, T>> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const methodExpression = new MethodCallExpression(objectOperand, "groupBy" as MethodKey<T[]>, [this.keySelector.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = queryVisitor.visit(methodExpression, visitParam) as SelectExpression<object, IGroupArray<K, T>>;
        result.parentRelation = null;
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("GROUPBY", this.parent.hashCode()), this.keySelector ? this.keySelector.hashCode() : 0);
    }
}
