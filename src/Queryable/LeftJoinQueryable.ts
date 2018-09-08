import { IObjectType, JoinType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";
import { hashCode } from "../Helper/Util";

export class LeftJoinQueryable<T = any, T2 = any, R = any> extends JoinQueryable<T, T2, R>  {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relation: FunctionExpression<T | T2, boolean> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<T | T2, R> | ((item1: T, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(JoinType.LEFT, parent, parent2, relation, resultSelector, type);
    }
    public hashCode() {
        return hashCode("LEFTJOIN", this.parent.hashCode() + this.parent2.hashCode());
    }
}
