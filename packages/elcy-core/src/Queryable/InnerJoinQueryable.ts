import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { JoinQueryable } from "./JoinQueryable";
import { Queryable } from "./Queryable";

export class InnerJoinQueryable<T = any, T2 = any, R = any> extends JoinQueryable<T, T2, R> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relation: FunctionExpression<boolean> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<R> | ((item1: T, item2: T2) => R), public type: IObjectType<R> = Object as any) {
        super("INNER", parent, parent2, relation, resultSelector, type);
    }
    public hashCode() {
        return hashCodeAdd(hashCode("INNERJOIN", this.parent.hashCode()), this.parent2.hashCode());
    }
}
