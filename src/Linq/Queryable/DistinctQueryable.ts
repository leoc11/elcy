import { IObjectType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { Queryable } from "./Queryable";

export class DistinctQueryable<T> extends Queryable<T> {
    constructor(protected readonly parent: Queryable<T>, protected readonly selector: FunctionExpression<T, any>) {
        super(parent.type, parent.queryBuilder);
    }
}
