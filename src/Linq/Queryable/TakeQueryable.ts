import { Queryable } from "./Queryable";

export class TakeQueryable<T> extends Queryable<T> {
    constructor(protected readonly parent: Queryable<T>, protected readonly takeCount: number) {
        super(parent.type, parent.queryBuilder);
    }
}
