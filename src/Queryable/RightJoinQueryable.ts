import { IObjectType, JoinType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";
import { hashCode } from "../Helper/Util";

export class RightJoinQueryable<T = any, T2 = any, R = any> extends JoinQueryable<T, T2, R> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relation: FunctionExpression<T | T2, boolean> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<T | T2, R> | ((item1: T | null, item2: T2) => R), public type: IObjectType<R> = Object as any) {
        super(JoinType.RIGHT, parent, parent2, relation, resultSelector, type);
    }
    public hashCode() {
        return hashCode("RIGHTJOIN", this.parent.hashCode() + this.parent2.hashCode());
    }
}
