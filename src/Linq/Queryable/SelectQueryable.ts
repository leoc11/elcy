import { IObjectType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { Queryable } from "./Queryable";

export class SelectQueryable<S, T> extends Queryable<T> {
    constructor(public type: IObjectType<T>, protected readonly parent: Queryable<S>, protected readonly selector: FunctionExpression<S, T>) {
        super(type, parent.queryBuilder);
    }
}
