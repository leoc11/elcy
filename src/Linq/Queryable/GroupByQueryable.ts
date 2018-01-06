import { FunctionExpression, ObjectValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { IGroupArray } from "../Interface/IGroupArray";
import { Queryable } from "./Queryable";
import { ColumnExpression, ComputedColumnExpression, GroupByExpression, IColumnExpression, IEntityExpression, SelectExpression } from "./QueryExpression/index";

export class GroupByQueryable<T, K> extends Queryable<IGroupArray<T, K>> {
    protected readonly keySelector: FunctionExpression<T, K>;
    constructor(public readonly parent: Queryable<T>, keySelector: FunctionExpression<T, K> | ((item: T) => K)) {
        super(Array, parent.queryBuilder);
        this.keySelector = keySelector instanceof FunctionExpression ? keySelector : ExpressionFactory.prototype.ToExpression(keySelector, parent.type);
    }
    public execute(): SelectExpression<IGroupArray<T, K>> {
        if (!this.expression) {
            this.expression = new GroupByExpression<any, any>(this.parent.execute());
            this.queryBuilder.parameters.add(this.keySelector.Params[0].name, this.type);
            const param = { parent: this.expression };
            const selectExpression = this.queryBuilder.visit(this.keySelector, param);
            this.queryBuilder.parameters.remove(this.keySelector.Params[0].name);

            if ((selectExpression as IEntityExpression).columns) {
                const entityExpression = selectExpression as IEntityExpression;
                param.parent.groupBy = entityExpression.columns;
            }
            else if ((selectExpression as IColumnExpression).entity) {
                const columnExpression = selectExpression as IColumnExpression;
                param.parent.groupBy.add(columnExpression);
            }
            else if (selectExpression instanceof ObjectValueExpression) {
                // TODO: select expression like o => {asd: o.Prop} need optimization. remove unused relation/join
                param.parent.groupBy = Object.keys(selectExpression.Object).select(
                    (o) => selectExpression.Object[o] instanceof ColumnExpression ? selectExpression.Object[o] : new ComputedColumnExpression(this.expression.entity, selectExpression.Object[o], this.queryBuilder.newAlias("column"))
                ).toArray();
            }
            this.expression = param.parent;
        }
        return this.expression;
    }
}
