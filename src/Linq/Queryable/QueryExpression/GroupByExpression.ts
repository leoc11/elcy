import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression, ProjectionEntityExpression } from "./index";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    constructor(public readonly select: SelectExpression<T>, public readonly groupBy: IColumnExpression[], key?: IEntityExpression | IColumnExpression) {
        super(select.entity);
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
}
