import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";
import { hashCode, hashCodeAdd } from "../Helper/Util";

export class RightJoinQueryable<T = any, T2 = any, R = any> extends JoinQueryable<T, T2, R> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relation: FunctionExpression<boolean> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<R> | ((item1: T | null, item2: T2) => R), public type: IObjectType<R> = Object as any) {
        super("RIGHT", parent, parent2, relation, resultSelector, type);
    }
    public hashCode() {
        return hashCodeAdd(hashCode("RIGHTJOIN", this.parent.hashCode()), this.parent2.hashCode());
    }
}
