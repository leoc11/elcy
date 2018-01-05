import { Queryable } from "./Queryable";

export class SkipQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly skipCount: number) {
        super(parent.type, parent.queryBuilder);
    }
}
