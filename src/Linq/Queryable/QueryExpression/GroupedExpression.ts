import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupedExpression<T = any, TKey = any> extends SelectExpression<T> {
    constructor(public readonly select: SelectExpression<T>, public readonly key: IEntityExpression<TKey>) {
        super(select.entity);
    }
}
