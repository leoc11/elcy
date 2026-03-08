export interface IEnumerableCache<T = unknown> {
    enabled?: boolean;
    isDone?: boolean;
    iterator?: IterableIterator<T>;
    result?: T[];
}
