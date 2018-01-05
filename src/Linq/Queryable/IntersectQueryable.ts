import { Queryable } from "./Queryable";

export class IntersectQueryable<T> extends Queryable<T> {
    constructor(protected readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type, parent.queryBuilder);
    }
}
