import { genericType } from "../../../Common/Type";
import { SelectExpression } from "./SelectExpression";

export class DistinctExpression<T> extends SelectExpression<T> {
    public readonly type: genericType<T>;
    constructor(public readonly select: SelectExpression<T>, type?: genericType<T>) {
        super(select.entity);
        this.select = select;
        if (type)
            this.type = type;
    }
}
