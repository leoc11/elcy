import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";

export class WhereQueryable<T> extends Queryable<T> {
    protected readonly predicate: FunctionExpression<T, boolean>;
    constructor(public readonly parent: Queryable<T>, predicate: FunctionExpression<T, boolean> | ((item: T) => boolean)) {
        super(parent.type, parent.queryBuilder);
        this.predicate = predicate instanceof FunctionExpression ? predicate : ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, parent.type);
    }
}
