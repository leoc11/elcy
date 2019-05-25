import { IEnumerable } from "../Enumerable/IEnumerable";

export interface IQueryResult<T = any> {
    effectedRows?: number;
    rows?: IEnumerable<T>;
}
