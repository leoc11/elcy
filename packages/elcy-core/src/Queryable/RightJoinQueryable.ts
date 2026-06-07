import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { hashCode, hashCodeAdd } from "../Helper/Hash";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable.internal";

export class RightJoinQueryable<T = unknown, T2 = unknown, R = unknown> extends JoinQueryable<T, T2, R> {
    constructor(parent: Queryable<T>, parent2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<R, [T | null, T2]> | ((item1: T | null, item2: T2) => R), type: IObjectType<R> | ObjectConstructor = Object) {
        super("RIGHT", parent, parent2, relation, resultSelector, type);
    }
    public hashCode() {
        return hashCodeAdd(hashCode("RIGHTJOIN", this.parent.hashCode()), this.parent2.hashCode());
    }
}
