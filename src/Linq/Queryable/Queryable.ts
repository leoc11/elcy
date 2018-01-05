import { IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../Sql/QueryBuilder";
import { Enumerable } from "../Enumerable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";

export class Queryable<T = any> extends Enumerable<T> {
    public expression: IQueryExpression<T>;
    public parent: Queryable;
    constructor(public type: IObjectType<T>, public queryBuilder: QueryBuilder) {
        super();
    }
}
