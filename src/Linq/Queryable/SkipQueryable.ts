import { Queryable } from "./Queryable";

export class SkipQueryable<T> extends Queryable<T> {
    constructor(protected readonly parent: Queryable<T>, protected readonly skipCount: number) {
        super(parent.type, parent.queryBuilder);
    }
}
