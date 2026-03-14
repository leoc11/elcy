import { IEnumerable } from "@elcy/enumerable";

export interface IQueryResult<T = unknown> {
    effectedRows?: number;
    rows?: IEnumerable<T>;
}
