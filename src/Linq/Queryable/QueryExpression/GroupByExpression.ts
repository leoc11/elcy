import { IExpression, AndExpression } from "../../../ExpressionBuilder/Expression";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public having: IExpression<boolean>;
    public select: GroupedExpression<T, any>;
    constructor(select: SelectExpression<T>, public readonly groupBy: IColumnExpression[], public readonly key: IExpression) {
        super(select);
        let groupExp: GroupedExpression;
        if (select instanceof GroupedExpression) {
            groupExp = new GroupedExpression(select.select, select.key);
        }
        else {
            const selectExp = new SelectExpression(select);
            selectExp.columns = this.groupBy.slice();
            groupExp = new GroupedExpression(select, key);
        }
        this.select = groupExp;
    }
    public getVisitParam() {
        return this.select;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.having = this.having ? new AndExpression(this.having, expression) : expression;
    }
    public clone(): GroupByExpression<T> {
        const clone = new GroupByExpression(this.select, this.groupBy, this.key);
        clone.copy(this);
        return clone;
    }
}
