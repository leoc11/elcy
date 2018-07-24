import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";

export class DistinctQueryable<T> extends Queryable<T> {
    protected readonly selectorFn?: (item: T) => any;
    private _selector?: FunctionExpression<T, any>;
    protected get selector() {
        if (!this._selector && this.selectorFn)
            this._selector = ExpressionBuilder.parse(this.selectorFn);
        return this._selector;
    }
    protected set selector(value) {
        this._selector = value;
    }
    constructor(public readonly parent: Queryable<T>) {
        super(parent.type, parent);
    }
    public buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryBuilder) as SelectExpression<T>;
        const methodParams = [];
        if (this.selector)
            methodParams.push(this.selector);

        const methodExpression = new MethodCallExpression(objectOperand, "distinct", methodParams);
        const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "queryable" };
        return queryBuilder.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("DISTINCT", this.parent.hashCode() + hashCode((this.selectorFn || this.selector || "").toString()));
    }
}
