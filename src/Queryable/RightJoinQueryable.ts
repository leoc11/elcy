import { IObjectType, JoinType, ValueType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";
import { hashCode } from "../Helper/Util";

export class RightJoinQueryable<T = any, T2 = any, K extends ValueType = any, R = any> extends JoinQueryable<T, T2, K, R> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, keySelector1: FunctionExpression<T, K> | ((item: T) => K), keySelector2: FunctionExpression<T2, K> | ((item: T2) => K), resultSelector?: FunctionExpression<T | T2, R> | ((item1: T | null, item2: T2) => R), public type: IObjectType<R> = Object as any) {
        super(JoinType.RIGHT, parent, parent2, keySelector1, keySelector2, resultSelector, type);
    }
    public hashCode() {
        return hashCode("RIGHTJOIN", this.parent.hashCode() + this.parent2.hashCode());
    }
}
