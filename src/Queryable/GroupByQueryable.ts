import { Queryable } from "./Queryable";
import { IVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IGroupArray } from "../QueryBuilder/Interface/IGroupArray";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IBuildResult } from "./IBuildResult";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";

export class GroupByQueryable<T, K> extends Queryable<IGroupArray<T, K>> {
    protected readonly keySelectorFn: (item: T) => K;
    private _keySelector: FunctionExpression<T, any>;
    protected get keySelector() {
        if (!this._keySelector && this.keySelectorFn)
            this._keySelector = ExpressionBuilder.parse(this.keySelectorFn);
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
    public buildQuery(queryBuilder: QueryBuilder): IBuildResult<IGroupArray<T, K>> {
        const buildResult = this.parent.buildQuery(queryBuilder);
        const objectOperand = buildResult.expression;
        const methodExpression = new MethodCallExpression(objectOperand, "groupBy", [this.keySelector]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
        buildResult.expression = queryBuilder.visit(methodExpression, visitParam) as any;
        return buildResult as any;
    }
    public hashCode() {
        return hashCode("GROUPBY", this.parent.hashCode() + hashCode((this.keySelectorFn || this.keySelector || "").toString()));
    }
}
