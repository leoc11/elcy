import { IExpression, AndExpression } from "../../ExpressionBuilder/Expression";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public having: IExpression<boolean>;
    public select: GroupedExpression<T, any>;
    public where: IExpression<boolean>;
    constructor(select: SelectExpression<T>, public readonly groupBy: IColumnExpression[], public readonly key: IExpression) {
        super(select.entity);
        let groupExp: GroupedExpression;
        if (select instanceof GroupedExpression) {
            groupExp = new GroupedExpression(select.select, select.key);
        }
        else {
            const selectExp = select.clone();
            selectExp.selects = this.groupBy.slice(0);
            groupExp = new GroupedExpression(selectExp, key);
        }
        this.select = groupExp;
        this.where = this.select.where.clone();
        this.selects = this.select.selects.slice(0);
        this.includes = this.select.includes.slice(0);
        this.joins = this.select.joins.slice(0);
        this.parentRelation = select.parentRelation;
        if (this.parentRelation) {
            this.parentRelation.child = this;
        }
    }
    public getVisitParam() {
        return this.select;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.having = this.having ? new AndExpression(this.having, expression) : expression;
    }
    public clone(): GroupByExpression<T> {
        const clone = new GroupByExpression(this.select, this.groupBy, this.key);
        return clone;
    }
}
