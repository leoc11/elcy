import { Queryable } from "./Queryable";

export class ExceptQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type, parent.queryBuilder);
    }
}
