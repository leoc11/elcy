import { GenericType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression, GroupByExpression } from "./QueryExpression";

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
            const res = this.parent.buildQuery(queryBuilder) as any;
            const objectOperand = res instanceof GroupByExpression ? new GroupByExpression(res.select, res.groupBy) : new SelectExpression<any>(res);
            const methodExpression = new MethodCallExpression(objectOperand, "select", [this.selector]);
            const visitParam = { parent: objectOperand, type: "select" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
}
