import { genericType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { IColumnExpression, IEntityExpression, SelectExpression } from "./QueryExpression";

export class IncludeQueryable<T> extends Queryable<T> {
    protected readonly selectors: Array<FunctionExpression<T, any>>;
    constructor(public readonly parent: Queryable<T>, selectors: Array<((item: T) => any) | FunctionExpression<T, any>>, public type: genericType<T> = Object) {
        super(type, parent.queryBuilder);
        this.selectors = selectors.select((o) => o instanceof FunctionExpression ? o : ExpressionFactory.prototype.ToExpression<T, any>(o, parent.type)).toArray();
    }
    public execute() {
        if (!this.expression) {
            this.expression = new SelectExpression(this.parent.execute());
            const param = { parent: this.expression };
            for (const selector of this.selectors) {
                this.queryBuilder.parameters.add(selector.Params[0].name, this.type);
                const selectExpression = this.queryBuilder.visit(selector, param);
                this.queryBuilder.parameters.remove(selector.Params[0].name);

                if ((selectExpression as IEntityExpression).columns) {
                    const entityExpression = selectExpression as IEntityExpression;
                    for (const column of entityExpression.columns)
                        param.parent.columns.add(column);
                }
                else if ((selectExpression as IColumnExpression).entity) {
                    const columnExpression = selectExpression as IColumnExpression;
                    param.parent.columns.add(columnExpression);
                }
            }
            this.expression = param.parent;
        }
        return this.expression;
    }
}
