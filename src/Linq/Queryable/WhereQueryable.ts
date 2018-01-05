import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { Queryable } from "./Queryable";

export class UnionQueryable<T> extends Queryable<T> {
    constructor(protected readonly parent: Queryable<T>, protected readonly predicate: FunctionExpression<T, boolean>) {
        super(parent.type, parent.queryBuilder);
    }
}
