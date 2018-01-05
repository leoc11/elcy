import { Queryable } from "./Queryable";

export class UnionQueryable<T> extends Queryable<T> {
    constructor(protected readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type, parent.queryBuilder);
    }
}
