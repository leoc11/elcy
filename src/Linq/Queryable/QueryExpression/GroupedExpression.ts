import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { IEntityExpression } from "./IEntityExpression";

export class GroupedExpression<T = any, TKey extends { [Key: string]: IExpression } = any> extends SelectExpression<T> {
    constructor(public readonly select: SelectExpression<T>, public readonly key: IEntityExpression<TKey>) {
        super(select.entity);
    }
    public getVisitParam() {
        return this.entity;
    }
}
