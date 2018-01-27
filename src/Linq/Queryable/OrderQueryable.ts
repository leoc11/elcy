import { OrderDirection, ValueType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression, ValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class OrderQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    protected readonly selector: FunctionExpression<T, ValueType>;
    constructor(public readonly parent: Queryable<T>, selector: FunctionExpression<T, ValueType> | ((item: T) => ValueType), protected readonly direction: OrderDirection) {
        super(parent.type);
        this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression(selector, parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            this.expression = new SelectExpression(this.parent.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, "orderBy", [this.selector, new ValueExpression(this.direction)]);
            const param = { parent: this.expression, type: "orderBy" };
            queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression as any;
    }
}
