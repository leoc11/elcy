import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";

export class CrossJoinQueryable<T = unknown, T2 = unknown, R = unknown> extends JoinQueryable<T, T2, R> {
    constructor(parent: Queryable<T>, parent2: Queryable<T2>, resultSelector: FunctionExpression<R, [T, T2 | null]> | ((item1: T, item2: T2 | null) => R), type: IObjectType<R> | ObjectConstructor = Object) {
        super("CROSS", parent, parent2, null, resultSelector, type);
    }
    public hashCode() {
        return hashCodeAdd(hashCode("CROSSJOIN", this.parent.hashCode()), this.parent2.hashCode());
    }
}
