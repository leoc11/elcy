import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { ComputedColumnExpression, GroupByExpression } from "./QueryExpression/index";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class PivotQueryable<T, TD extends { [key: string]: ((item: T) => any) | FunctionExpression<T, any> }, TM extends { [key: string]: ((item: T[]) => any) | FunctionExpression<T[], any> }, TResult extends {[key in (keyof TD & keyof TM)]: any }> extends Queryable<TResult> {
    public readonly dimensions: { [key: string]: FunctionExpression<T, any> } = {};
    public readonly metrics: { [key: string]: FunctionExpression<T[], any> } = {};
    constructor(public readonly parent: Queryable<T>, dimensions: TD, metrics: TM) {
        super(Object, parent.queryBuilder);
        // tslint:disable-next-line:forin
        for (const key in dimensions) {
            const val: ((item: T) => any) | FunctionExpression<T, any> = dimensions[key];
            this.dimensions[key] = val instanceof FunctionExpression ? val : ExpressionFactory.prototype.ToExpression(val, parent.type);
        }
        // tslint:disable-next-line:forin
        for (const key in metrics) {
            const val: ((item: T[]) => any) | FunctionExpression<T[], any> = metrics[key];
            this.metrics[key] = val instanceof FunctionExpression ? val : ExpressionFactory.prototype.ToExpression(val, Array);
        }
    }

    public execute(): SelectExpression<TResult> {
        if (!this.expression) {
            const expression = new SelectExpression<any>(this.parent.execute() as any);
            const groups: any[] = [];
            const columns: any[] = [];
            const param = { parent: expression, type: "select" };
            // tslint:disable-next-line:forin
            for (const dimensionKey in this.dimensions) {
                this.queryBuilder.parameters.add(this.dimensions[dimensionKey].params[0].name, this.type);
                const selectExpression = this.queryBuilder.visit(this.dimensions[dimensionKey], param as any);
                this.queryBuilder.parameters.remove(this.dimensions[dimensionKey].params[0].name);
                groups.add(new ComputedColumnExpression(param.parent.entity, selectExpression, this.queryBuilder.newAlias("column")));
            }
            // tslint:disable-next-line:forin
            for (const key in this.metrics) {
                this.queryBuilder.parameters.add(this.metrics[key].params[0].name, this.type);
                const selectExpression = this.queryBuilder.visit(this.metrics[key], param as any);
                this.queryBuilder.parameters.remove(this.metrics[key].params[0].name);
                columns.add(new ComputedColumnExpression(param.parent.entity, selectExpression, this.queryBuilder.newAlias("column")));
            }
            const groupByExpression = new GroupByExpression<any, any>(expression);
            groupByExpression.columns = groups.concat(columns);
            groupByExpression.groupBy = groups;
            this.expression = groupByExpression;
        }
        return this.expression as any;
    }
}
