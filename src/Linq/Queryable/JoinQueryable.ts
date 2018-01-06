import { IObjectType } from "../../Common/Type";
import { FunctionExpression, ObjectValueExpression } from "../../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { ColumnExpression, ComputedColumnExpression, JoinEntityExpression, ProjectionEntityExpression, SelectExpression } from "./QueryExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";

export abstract class JoinQueryable<T = any, T2 = any, K = any, R = any> extends Queryable<R> {
    protected readonly keySelector1: FunctionExpression<T, K>;
    protected readonly keySelector2: FunctionExpression<T2, K>;
    protected readonly resultSelector: FunctionExpression<T | T2, R>;
    constructor(protected joinType: "INNER" | "FULL" | "RIGHT" | "LEFT", public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<T | T2, R> | ((item1: T | null, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(type, parent.queryBuilder);
        this.keySelector1 = keySelector1 instanceof FunctionExpression ? keySelector1 : ExpressionFactory.prototype.ToExpression<T, K>(keySelector1, parent.type);
        this.keySelector2 = keySelector2 instanceof FunctionExpression ? keySelector2 : ExpressionFactory.prototype.ToExpression<T2, K>(keySelector2, parent2.type);
        if (resultSelector)
            this.resultSelector = resultSelector instanceof FunctionExpression ? resultSelector : ExpressionFactory.prototype.ToExpression2<T, T2, R>(resultSelector, parent.type, parent2.type);
    }
    public execute() {
        if (!this.expression) {
            const parent1Expression = new SelectExpression(this.parent.execute());
            const parent2Expression = new SelectExpression(this.parent2.execute());
            let param: { parent: ICommandQueryExpression } = { parent: parent1Expression };
            this.queryBuilder.parameters.add(this.keySelector1.Params[0].name, this.parent.type);
            const keySelector1 = this.queryBuilder.visit(this.keySelector1, param);
            this.queryBuilder.parameters.remove(this.keySelector1.Params[0].name);

            param = { parent: parent2Expression };
            this.queryBuilder.parameters.add(this.keySelector2.Params[0].name, this.parent2.type);
            const keySelector2 = this.queryBuilder.visit(this.keySelector2, param);
            this.queryBuilder.parameters.remove(this.keySelector2.Params[0].name);

            const joinEntity = new JoinEntityExpression<any, any, any>(
                new ProjectionEntityExpression(parent1Expression, this.queryBuilder.newAlias()),
                new ProjectionEntityExpression(parent2Expression, this.queryBuilder.newAlias()),
                this.queryBuilder.newAlias(), this.joinType);

            joinEntity.relations.add({ leftColumn: keySelector1, rightColumn: keySelector2 });

            this.expression = new SelectExpression<R>(joinEntity);

            if (this.resultSelector) {
                this.queryBuilder.parameters.add(this.resultSelector.Params[0].name, this.parent.type);
                this.queryBuilder.parameters.add(this.resultSelector.Params[1].name, this.parent2.type);
                const resultSelector: ObjectValueExpression<any> = this.queryBuilder.visit(this.resultSelector, param);
                this.queryBuilder.parameters.remove(this.resultSelector.Params[0].name);
                this.queryBuilder.parameters.remove(this.resultSelector.Params[1].name);

                this.expression.columns = Object.keys(resultSelector.Object).select(
                    (o) => resultSelector.Object[o] instanceof ColumnExpression ? resultSelector.Object[o] : new ComputedColumnExpression(this.expression.entity, resultSelector.Object[o], this.queryBuilder.newAlias("column"))
                ).toArray();
            }
        }
        return this.expression;
    }
}
