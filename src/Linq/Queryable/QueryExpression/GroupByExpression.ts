import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { ProjectionEntityExpression } from "./index";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    constructor(public readonly select: SelectExpression<T>, public readonly groupBy: IColumnExpression[]) {
        super(select.entity);
        const selectExp = new SelectExpression(this.select.entity);
        selectExp.columns = this.groupBy;
        this.select = new GroupedExpression(select, new ProjectionEntityExpression(selectExp, this.entity.alias));
    }
    public getVisitParam() {
        return this.select;
    }
}
