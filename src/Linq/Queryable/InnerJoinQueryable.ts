import { IObjectType, JoinType, ValueType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";

export class InnerJoinQueryable<T = any, T2 = any, K extends ValueType = any, R = any> extends JoinQueryable<T, T2, K, R> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<any, R> | ((item1: T, item2: T2) => R), public type: IObjectType<R> = Object as any) {
        super(JoinType.INNER, parent, parent2, keySelector1, keySelector2, resultSelector, type);
    }
    public getHashCode() {
        return this.parent.getHashCode() + "-IJ-" + this.parent2.getHashCode();
    }
}
