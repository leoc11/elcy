import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";
import { IQueryVisitParameter } from "../QueryExpressionVisitor";

export class WhereQueryable<T> extends Queryable<T> {
    protected readonly predicateFn: (item: T) => boolean;
    protected _predicate: FunctionExpression<T, boolean>;
    protected get predicate() {
        if (!this._predicate && this.predicateFn)
            this._predicate = ExpressionFactory.prototype.ToExpression(this.predicateFn, this.parent.type);
        return this._predicate;
    }
    protected set predicate(value) {
        this._predicate = value;
    }
    constructor(public readonly parent: Queryable<T>, predicate: FunctionExpression<T, boolean> | ((item: T) => boolean)) {
        super(parent.type);
        if (predicate instanceof FunctionExpression)
            this.predicate = predicate;
        else
            this.predicateFn = predicate;
    }
    public buildQuery(queryBuilder: QueryBuilder): any {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "where", [this.predicate]);
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "where" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
    public getHashCode() {
        return this.parent.getHashCode() + "-WH" + Array.from((this.predicateFn || this.predicate).toString()).sum((o) => o.charCodeAt(0));
    }
}
