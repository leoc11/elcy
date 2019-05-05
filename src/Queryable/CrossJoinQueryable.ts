import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";
import { hashCode, hashCodeAdd } from "../Helper/Util";

export class CrossJoinQueryable<T = any, T2 = any, R = any> extends JoinQueryable<T, T2, R>  {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, resultSelector?: FunctionExpression<R> | ((item1: T, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super("CROSS", parent, parent2, null, resultSelector, type);
    }
    public hashCode() {
        return hashCodeAdd(hashCode("CROSSJOIN", this.parent.hashCode()), this.parent2.hashCode());
    }
}
