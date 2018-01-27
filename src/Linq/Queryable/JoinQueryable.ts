import { IObjectType, JoinType, ValueType } from "../../Common/Type";
import { FunctionExpression, IExpression, ObjectValueExpression, AndExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { IQueryVisitParameter } from "../QueryExpressionVisitor";
import { Queryable } from "./Queryable";
import { ComputedColumnExpression, IJoinRelationMap, JoinEntityExpression, ProjectionEntityExpression, SelectExpression } from "./QueryExpression";
import { IColumnExpression } from "./QueryExpression/IColumnExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { IEntityExpression } from "./QueryExpression/IEntityExpression";
import { EntityExpression } from "./QueryExpression/EntityExpression";

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
    public buildQuery(): ICommandQueryExpression<R> {
        if (!this.expression) {
            this.expression = new SelectExpression<any>(this.parent.buildQuery() as any);
            const parent2Expression = new SelectExpression(this.parent2.buildQuery(this.queryBuilder) as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, this.joinType.toLowerCase() + "Join", [parent2Expression, this.keySelector1, this.keySelector2, this.resultSelector]);
            const param = { parent: this.expression };
            this.queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression;
    }
}
