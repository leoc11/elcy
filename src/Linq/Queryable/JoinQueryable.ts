import { IObjectType, JoinType, ValueType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";

export abstract class JoinQueryable<T = any, T2 = any, K extends ValueType = any, R = any> extends Queryable<R> {
    public expression: SelectExpression<R>;
    protected readonly keySelector1: FunctionExpression<T, K>;
    protected readonly keySelector2: FunctionExpression<T2, K>;
    protected readonly resultSelector: FunctionExpression<T | T2, R>;
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    constructor(protected joinType: JoinType, public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<any, R> | ((item1: T | null, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(type);
        this.keySelector1 = keySelector1 instanceof FunctionExpression ? keySelector1 : ExpressionFactory.prototype.ToExpression<T, K>(keySelector1, parent.type);
        this.keySelector2 = keySelector2 instanceof FunctionExpression ? keySelector2 : ExpressionFactory.prototype.ToExpression<T2, K>(keySelector2, parent2.type);
        if (resultSelector)
            this.resultSelector = resultSelector instanceof FunctionExpression ? resultSelector : ExpressionFactory.prototype.ToExpression2<T, T2, R>(resultSelector, parent.type, parent2.type);
    }
    public buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<R> {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const childOperand = this.parent2.buildQuery(queryBuilder).clone() as SelectExpression;
            const type = this.joinType.toLowerCase() + "Join";
            const methodExpression = new MethodCallExpression(objectOperand, type, [childOperand, this.keySelector1, this.keySelector2, this.resultSelector]);
            const visitParam = { parent: objectOperand, type: type };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression;
    }
}
