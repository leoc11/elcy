import { Queryable } from "./Queryable";

export class TakeQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly takeCount: number) {
        super(parent.type, parent.queryBuilder);
    }
}
