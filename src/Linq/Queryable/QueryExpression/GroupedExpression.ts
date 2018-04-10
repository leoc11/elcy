import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../../ExpressionBuilder/Expression/IExpression";

export class GroupedExpression<T = any, TKey = any> extends SelectExpression<T> {
    constructor(public readonly select: SelectExpression<T>, public readonly key: IExpression<TKey>) {
        super(select.entity);
    }
}
