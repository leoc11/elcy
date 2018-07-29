import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { IVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";

export class WhereQueryable<T> extends Queryable<T> {
    protected readonly predicateFn: (item: T) => boolean;
    protected _predicate: FunctionExpression<T, boolean>;
    protected get predicate() {
        if (!this._predicate && this.predicateFn)
            this._predicate = ExpressionBuilder.parse(this.predicateFn);
        return this._predicate;
    }
    protected set predicate(value) {
        this._predicate = value;
    }
    constructor(public readonly parent: Queryable<T>, predicate: FunctionExpression<T, boolean> | ((item: T) => boolean)) {
        super(parent.type, parent);
        if (predicate instanceof FunctionExpression)
            this.predicate = predicate;
        else
            this.predicateFn = predicate;
    }
    public buildQuery(queryBuilder: QueryBuilder) {
        const buildResult = this.parent.buildQuery(queryBuilder);
        const objectOperand = buildResult.expression;
        const methodExpression = new MethodCallExpression(objectOperand, "where", [this.predicate]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
        buildResult.expression = queryBuilder.visit(methodExpression, visitParam) as any;
        return buildResult;
    }
    public hashCode() {
        return hashCode("WHERE", this.parent.hashCode() + hashCode((this.predicateFn || this.predicate).toString()));
    }
}
