export interface IQueryResult<T = any> {
    effectedRows: number;
    rows?: Iterable<T>;
}