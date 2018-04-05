import { IExpression, AndExpression } from "../../../ExpressionBuilder/Expression";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { ColumnExpression } from "./ColumnExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public having: IExpression<boolean>;
    public select: GroupedExpression<T, any>;
    constructor(select: SelectExpression<T>, public readonly groupBy: IColumnExpression[], key?: IEntityExpression | IColumnExpression) {
        super(select);
        let groupExp: GroupedExpression;
        if (select instanceof GroupedExpression) {
            groupExp = new GroupedExpression(select.select, select.key);
        }
        else {
            const selectExp = new SelectExpression(select);
            selectExp.columns = this.groupBy.slice();
            if (!key)
                key = new ProjectionEntityExpression(selectExp, select.entity.alias);
            else if (key instanceof ColumnExpression) {
                key.entity = new ProjectionEntityExpression(new (require("./SingleSelectExpression").SingleSelectExpression)(key.entity, key), key.entity.alias);
                // key.entity.alias = "key";
            }
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
