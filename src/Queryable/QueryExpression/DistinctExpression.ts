import { SelectExpression } from "./SelectExpression";

export class DistinctExpression<T> extends SelectExpression<T> {
    constructor(public readonly select: SelectExpression<T>) {
        super(select.entity);
        this.select = select;
    }
}
