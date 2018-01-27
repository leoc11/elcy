import { GenericType } from "../../../Common/Type";
import { SelectExpression } from "./SelectExpression";

export class DistinctExpression<T> extends SelectExpression<T> {
    public readonly type: GenericType<T>;
    constructor(public readonly select: SelectExpression<T>, type?: GenericType<T>) {
        super(select.entity);
        this.select = select;
        if (type)
            this.type = type;
    }
}
