import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { hashCode } from "../Helper/Hash";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable.internal";

export class FullJoinQueryable<T = any, T2 = any, R = any> extends JoinQueryable<T, T2, R> {
    constructor(parent: Queryable<T>, parent2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<R, [T | null, T2 | null]> | ((item1: T | null, item2: T2 | null) => R), type: IObjectType<R> | ObjectConstructor = Object) {
        super("FULL", parent, parent2, relation, resultSelector, type);
    }
    public hashCode() {
        return hashCode("FULLJOIN", this.parent.hashCode() + this.parent2.hashCode());
    }
}
