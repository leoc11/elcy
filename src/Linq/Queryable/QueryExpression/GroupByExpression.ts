import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { ProjectionEntityExpression } from "./index";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    constructor(public readonly select: SelectExpression<T>, public readonly groupBy: IColumnExpression[]) {
        super(select.entity);
        const selectExp = new SelectExpression(this.select);
        selectExp.columns = this.groupBy;
        const entity = new ProjectionEntityExpression(selectExp, this.select.entity.alias);
        this.select = new GroupedExpression(select, entity);
    }
    public getVisitParam() {
        return this.select;
    }
}
