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
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "include", this.selectors);
            const visitParam = { parent: objectOperand, type: "include" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
}
