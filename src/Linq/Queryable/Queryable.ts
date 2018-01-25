import { genericType } from "../../Common/Type";
import { Enumerable } from "../Enumerable";
// import { IGroupArray } from "../Interface/IGroupArray";
import { QueryBuilder } from "../QueryBuilder";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";

export abstract class Queryable<T = any> extends Enumerable<T> {
    protected expression: ICommandQueryExpression<T>;
    protected parent: Queryable;
    constructor(public type: genericType<T>, public queryBuilder: QueryBuilder) {
        super();
    }
    public buildQuery(): ICommandQueryExpression<T> {
        return this.expression;
    }
    public toString() {
        return this.buildQuery().toString(this.queryBuilder);
    }
}
