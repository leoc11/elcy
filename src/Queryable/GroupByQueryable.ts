import { Queryable } from "./Queryable";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IGroupArray } from "../QueryBuilder/Interface/IGroupArray";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class GroupByQueryable<T, K> extends Queryable<IGroupArray<T, K>> {
    protected readonly keySelectorFn: (item: T) => K;
    private _keySelector: FunctionExpression<T, any>;
    protected get keySelector() {
        if (!this._keySelector && this.keySelectorFn)
            this._keySelector = ExpressionBuilder.parse(this.keySelectorFn, this.flatParameterStacks);
        return this._keySelector;
    }
    protected set keySelector(value) {
        this._keySelector = value;
    }
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(Array as any, parent);
        if (keySelector instanceof FunctionExpression)
            this.keySelector = keySelector;
        else
            this.keySelectorFn = keySelector;
    }
    public buildQuery(queryVisitor: QueryVisitor): ICommandQueryExpression<IGroupArray<T, K>> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "groupBy", [this.keySelector]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("GROUPBY", this.parent.hashCode() + hashCode((this.keySelectorFn || this.keySelector || "").toString()));
    }
}
