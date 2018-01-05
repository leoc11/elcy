import { genericType } from "../../../Common/Type";
import { FunctionExpression } from "../../../ExpressionBuilder/Expression/index";
import { SelectExpression } from "./SelectExpression";

export class DistinctExpression<T> extends SelectExpression<T> {
    public readonly type: genericType<T>;
    constructor(public readonly select: SelectExpression<T>, public readonly keySelector?: FunctionExpression<T, any>, type?: genericType<T>) {
        super(select.entity);
        this.select = select;
        if (type)
            this.type = type;
    }
}
