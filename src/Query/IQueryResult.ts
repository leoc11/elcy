import { IEnumerable } from "../Enumerable/IEnumerable";

export interface IQueryResult<T = unknown> {
    effectedRows?: number;
    rows?: IEnumerable<T>;
}
