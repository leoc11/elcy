export interface IEnumerableCache<T = any> {
    enabled?: boolean;
    isDone?: boolean;
    result?: T[];
    iterator?: IterableIterator<any>;
}
