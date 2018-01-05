import { IObjectType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { Queryable } from "./Queryable";

export class GroupByQueryable<T, K> extends Queryable<GroupedEnumerable<T, K>> {
    constructor(protected readonly parent: Queryable<T>, protected readonly keySelector: FunctionExpression<T, K>) {
        super(type, parent.queryBuilder);
    }
}
