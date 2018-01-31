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
            const objectOperand = new SelectExpression<any>(this.parent.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(objectOperand, "orderBy", [this.selector]);
            const visitParam = { parent: objectOperand, type: "orderBy" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
}
