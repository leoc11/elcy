import { IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../Sql/QueryBuilder";
import { Enumerable } from "../Enumerable";

export class Queryable<T> extends Enumerable<T> {
    constructor(protected type: IObjectType<T>, protected queryBuilder: QueryBuilder) {
        super();
    }
}
