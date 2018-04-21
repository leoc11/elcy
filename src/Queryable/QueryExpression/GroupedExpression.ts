import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export class GroupedExpression<T = any, TKey = any> extends SelectExpression<T> {
    constructor(public readonly select: SelectExpression<T>, public readonly key: IExpression<TKey>) {
        super(select.entity);
        this.selects = this.select.selects.slice(0);
        this.relationColumns = this.select.relationColumns.slice(0);
        this.joins = this.select.joins.slice(0);
        this.includes = this.select.includes.slice(0);
        this.orders = this.select.orders.slice(0);
        if (this.select.where)
            this.where = this.select.where.clone();
    }
}
