import { orderDirection } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { Queryable } from "./Queryable";

export class OrderQueryable<T> extends Queryable<T> {
    constructor(protected readonly parent: Queryable<T>, protected readonly selector: FunctionExpression<T, any>, protected readonly direction: orderDirection) {
        super(parent.type, parent.queryBuilder);
    }
}
