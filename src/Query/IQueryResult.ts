import { IEnumerable } from "../Enumerable/IEnumerable";

export interface IQueryResult<T = any> {
    rows?: IEnumerable<T>;
    effectedRows?: number;
}
