import { Queryable } from "./Queryable";

export class GroupQueryable<TKey, TType> extends Queryable<TType> {
    public key?: TKey;
}
