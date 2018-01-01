import { ColumnExpression } from "./ColumnExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public select: SelectExpression<T>;
    public groupBy: ColumnExpression[];
    constructor(select: SelectExpression<T>, alias: string) {
        super(select.entity, alias);
        this.select = select;
    }
}
