import { GenericType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class SelectQueryable<S, T> extends Queryable<T> {
    protected readonly selector: FunctionExpression<S, T>;
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    constructor(public readonly parent: Queryable<S>, selector: ((item: S) => T) | FunctionExpression<S, T>, public type: GenericType<T> = Object) {
        super(type);
        this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression<S, T>(selector, parent.type);
    }
    public buildQuery(queryBuilder?: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            this.expression = new SelectExpression<any>(this.parent.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, "select", [this.selector]);
            const param = { parent: this.expression, type: "select" };
            queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression as any;
    }
}
