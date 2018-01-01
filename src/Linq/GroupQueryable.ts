import { genericType, IObjectType } from "../Common/Type";
import { Queryable } from "./Queryable";

export class GroupQueryable<TType, TKey> extends Queryable<TType> {
    constructor(type: IObjectType<TType>, public keyType: genericType<TKey>, groupBy: (item: TType) => TKey, alias?: string) {
        super(type, alias);
    }
}
