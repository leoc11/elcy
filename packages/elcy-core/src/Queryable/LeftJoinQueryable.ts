import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";

export class LeftJoinQueryable<T = unknown, T2 = unknown, R = unknown> extends JoinQueryable<T, T2, R>  {
    constructor(parent: Queryable<T>, parent2: Queryable<T2>, relation: FunctionExpression<boolean, [T, T2]> | ((item: T, item2: T2) => boolean), resultSelector: FunctionExpression<R, [T, T2 | null]> | ((item1: T, item2: T2 | null) => R), type: IObjectType<R> | ObjectConstructor = Object) {
        super("LEFT", parent, parent2, relation, resultSelector, type);
    }
    public hashCode() {
        return hashCodeAdd(hashCode("LEFTJOIN", this.parent.hashCode()), this.parent2.hashCode());
    }
}
