import { IExpression, AndExpression } from "../../../ExpressionBuilder/Expression";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public having: IExpression<boolean>;
    constructor(public readonly select: SelectExpression<T>, public readonly groupBy: IColumnExpression[], key?: IEntityExpression | IColumnExpression) {
        super(select);
        let groupExp: GroupedExpression;
        if (select instanceof GroupedExpression) {
            groupExp = new GroupedExpression(select.select, select.key);
        }
        else {
            const selectExp = new SelectExpression(select);
            selectExp.columns = this.groupBy.slice();
            if (!key)
                key = new ProjectionEntityExpression(selectExp, this.select.entity.alias);
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
        const clone = new GroupByExpression(this.select, this.groupBy);
        clone.copy(this);
        return clone;
    }
}
