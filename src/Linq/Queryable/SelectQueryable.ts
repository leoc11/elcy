import { genericType } from "../../Common/Type";
import { FunctionExpression, ObjectValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { ColumnExpression, ComputedColumnExpression, IColumnExpression, IEntityExpression, SelectExpression } from "./QueryExpression";

export class SelectQueryable<S, T> extends Queryable<T> {
    protected readonly selector: FunctionExpression<S, T>;
    constructor(public readonly parent: Queryable<S>, selector: ((item: S) => T) | FunctionExpression<S, T>, public type: genericType<T> = Object) {
        super(type, parent.queryBuilder);
        this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression<S, T>(selector, parent.type);
    }
    public execute(): SelectExpression<T> {
        if (!this.expression) {
            this.expression = new SelectExpression<any>(this.parent.execute());
            this.queryBuilder.parameters.add(this.selector.Params[0].name, this.type);
            const param = { parent: this.expression };
            const selectExpression = this.queryBuilder.visit(this.selector, param);
            this.queryBuilder.parameters.remove(this.selector.Params[0].name);

            param.parent.columns = [];
            if ((selectExpression as IEntityExpression).columns) {
                if (!param.parent.where) {
                    const entityExpression = selectExpression as IEntityExpression;
                    param.parent = new SelectExpression(entityExpression);
                }
            }
            else if ((selectExpression as IColumnExpression).entity) {
                const columnExpression = selectExpression as IColumnExpression;
                if (!param.parent.where)
                    param.parent = new SelectExpression(columnExpression.entity);
                param.parent.columns.add(columnExpression);
            }
            else if (selectExpression instanceof ObjectValueExpression) {
                // TODO: select expression like o => {asd: o.Prop} need optimization. remove unused relation/join
                this.expression.columns = Object.keys(selectExpression.Object).select(
                    (o) => selectExpression.Object[o] instanceof ColumnExpression ? selectExpression.Object[o] : new ComputedColumnExpression(this.expression.entity, selectExpression.Object[o], this.queryBuilder.newAlias("column"))
                ).toArray();
            }
            this.expression = param.parent;
        }
        return this.expression;
    }
}
