import { IObjectType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { Queryable } from "./Queryable";

export class InnerJoinQueryable<T = any, T2 = any, K = any, R = any> extends Queryable<R> {
    constructor(public type: IObjectType<R>, protected readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, protected readonly keySelector1: FunctionExpression<T, K>, protected readonly keySelector2: FunctionExpression<T2, K>, protected readonly resultSelector: FunctionExpression<T|T2, R>) {
        super(type, parent.queryBuilder);
    }
}
