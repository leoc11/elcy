import { IObjectType, JoinType, ValueType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";

export class FullJoinQueryable<T = any, T2 = any, K extends ValueType = any, R = any> extends JoinQueryable<T, T2, K, R> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<T | T2, R> | ((item1: T | null, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(JoinType.FULL, parent, parent2, keySelector1, keySelector2, resultSelector, type);
    }
    public getHashCode() {
        return "FJ(" + this.parent.getHashCode() + "," + this.parent2.getHashCode() + ")";
    }
}
