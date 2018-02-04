import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { GroupedEnumerable } from "../Enumerable/GroupedEnumerable";
import { QueryBuilder } from "../QueryBuilder";
// import { IGroupArray } from "../Interface/IGroupArray";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/index";

export class GroupByQueryable<T, K> extends Queryable<GroupedEnumerable<T, K>> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    public expression: SelectExpression<GroupedEnumerable<T, K>>;
    protected readonly keySelector: FunctionExpression<T, K>;
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(Array as any);
        this.keySelector = keySelector instanceof FunctionExpression ? keySelector : ExpressionFactory.prototype.ToExpression(keySelector, parent.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<GroupedEnumerable<T, K>> {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "groupBy", [this.keySelector]);
            const visitParam = { parent: objectOperand, type: "groupBy" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
}
