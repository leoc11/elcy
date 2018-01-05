import { Queryable } from "./Queryable";

export class PivotQueryable<T, TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }> extends Queryable<TResult> {
    constructor(public readonly parent: Queryable<T>, public readonly dimensions: TD, public readonly metrics: TM) {
        super(Object, parent.queryBuilder);
    }
}
