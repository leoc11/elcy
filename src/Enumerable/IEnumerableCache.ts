export interface IEnumerableCache<T = any> {
    enabled?: boolean;
    isDone?: boolean;
    iterator?: IterableIterator<any>;
    result?: T[];
}
