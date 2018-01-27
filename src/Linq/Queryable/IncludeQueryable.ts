import { GenericType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class IncludeQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    protected readonly selectors: Array<FunctionExpression<T, any>>;
    constructor(public readonly parent: Queryable<T>, selectors: Array<((item: T) => any) | FunctionExpression<T, any>>, public type: GenericType<T> = Object) {
        super(type);
        this.selectors = selectors.select((o) => o instanceof FunctionExpression ? o : ExpressionFactory.prototype.ToExpression<T, any>(o, parent.type)).toArray();
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<T> {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            this.expression = new SelectExpression<any>(this.parent.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, "include", this.selectors);
            const param = { parent: this.expression, type: "include" };
            queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression as any;
    }
}
