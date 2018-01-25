import { IObjectType, JoinType } from "../../Common/Type";
import { FunctionExpression, ObjectValueExpression } from "../../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { IQueryVisitParameter } from "../QueryExpressionVisitor";
import { Queryable } from "./Queryable";
import { ColumnExpression, ComputedColumnExpression, IJoinRelationMap, JoinEntityExpression, ProjectionEntityExpression, SelectExpression } from "./QueryExpression";
import { IColumnExpression } from "./QueryExpression/IColumnExpression";

export abstract class JoinQueryable<T = any, T2 = any, K = any, R = any> extends Queryable<R> {
    protected readonly keySelector1: FunctionExpression<T, K>;
    protected readonly keySelector2: FunctionExpression<T2, K>;
    protected readonly resultSelector: FunctionExpression<T | T2, R>;
    constructor(protected joinType: JoinType, public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<T | T2, R> | ((item1: T | null, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(type, parent.queryBuilder);
        this.keySelector1 = keySelector1 instanceof FunctionExpression ? keySelector1 : ExpressionFactory.prototype.ToExpression<T, K>(keySelector1, parent.type);
        this.keySelector2 = keySelector2 instanceof FunctionExpression ? keySelector2 : ExpressionFactory.prototype.ToExpression<T2, K>(keySelector2, parent2.type);
        if (resultSelector)
            this.resultSelector = resultSelector instanceof FunctionExpression ? resultSelector : ExpressionFactory.prototype.ToExpression2<T, T2, R>(resultSelector, parent.type, parent2.type);
    }
    public execute() {
        if (!this.expression) {
            const parent1Expression = new SelectExpression(this.parent.execute() as any);
            const parent2Expression = new SelectExpression(this.parent2.execute() as any);
            let param: IQueryVisitParameter = { parent: parent1Expression };
            this.queryBuilder.parameters.add(this.keySelector1.params[0].name, this.parent.type);
            const keySelector1 = this.queryBuilder.visit(this.keySelector1, param) as IColumnExpression;
            this.queryBuilder.parameters.remove(this.keySelector1.params[0].name);

            param = { parent: parent2Expression };
            this.queryBuilder.parameters.add(this.keySelector2.params[0].name, this.parent2.type);
            const keySelector2 = this.queryBuilder.visit(this.keySelector2, param) as IColumnExpression;
            this.queryBuilder.parameters.remove(this.keySelector2.params[0].name);

            const joinEntity = new JoinEntityExpression(new ProjectionEntityExpression<T>(parent1Expression, this.queryBuilder.newAlias()));
            const relationMap: Array<IJoinRelationMap<T, T2>> = [];
            relationMap.add({
                childColumn: keySelector1,
                parentColumn: keySelector2
            });
            joinEntity.addRelation(relationMap, new ProjectionEntityExpression(parent2Expression, this.queryBuilder.newAlias()), this.joinType);
            this.expression = new SelectExpression<R>(joinEntity);

            if (this.resultSelector) {
                this.queryBuilder.parameters.add(this.resultSelector.params[0].name, this.parent.type);
                this.queryBuilder.parameters.add(this.resultSelector.params[1].name, this.parent2.type);
                const resultSelector = this.queryBuilder.visit(this.resultSelector, param) as ObjectValueExpression<any>;
                this.queryBuilder.parameters.remove(this.resultSelector.params[0].name);
                this.queryBuilder.parameters.remove(this.resultSelector.params[1].name);

                (this.expression as SelectExpression<R>).columns = Object.keys(resultSelector.object).select(
                    (o) => resultSelector.object[o] instanceof ColumnExpression ? resultSelector.object[o] : new ComputedColumnExpression(this.expression.entity, resultSelector.object[o], this.queryBuilder.newAlias("column"))
                ).toArray();
            }
        }
        return this.expression;
    }
}
