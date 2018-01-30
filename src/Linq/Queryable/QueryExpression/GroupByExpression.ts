import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { IEntityExpression } from "./IEntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { GroupedExpression } from "./GroupedExpression";

export class GroupByExpression<T = any, TKey extends { [Key: string]: IExpression } = any> extends SelectExpression<T> {
    public get groupBy(): IColumnExpression[] {
        if (!this._groupBy)
            this._groupBy = this.key.columns.slice();
        return this._groupBy;
    }
    private _groupBy: IColumnExpression[];
    constructor(public readonly select: SelectExpression<T>, public readonly key: IEntityExpression<TKey>) {
        super(select.entity);
        this.select = new GroupedExpression(select, key);
    }
    public getVisitParam() {
        return this.select;
    }
}
