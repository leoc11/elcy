import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class DistinctQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    protected readonly selector?: FunctionExpression<T, any>;
    constructor(public readonly parent: Queryable<T>) {
        super(parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): any {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodParams = [];
            if (this.selector)
                methodParams.push(this.selector);

            const methodExpression = new MethodCallExpression(objectOperand, "distinct", methodParams);
            const visitParam = { parent: objectOperand, type: "distinct" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
}
