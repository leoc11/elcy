export interface IEnumerable<T> extends Iterable<T> {
    map<TReturn>(selector: ((item: T) => TReturn)): IEnumerable<TReturn>;
    flatMap<TReturn>(selector: (item: T) => TReturn | Iterable<TReturn>): IEnumerable<TReturn>;
    filter(predicate: (item: T) => boolean): IEnumerable<T>;
    every(predicate: (item: T) => boolean): boolean;
    some(predicate: (item: T) => boolean): boolean;
    includes(item: T): boolean;
    slice(skip: number, take?: number): IEnumerable<T>;
    find(predicate: (item: T) => boolean): T;
    concat(...items: (Iterable<T> | ConcatArray<T>)[]): IEnumerable<T>;
    reduce<R = T>(callbackfn: (previousValue: R, currentValue: T) => R, initialValue?: R): R;
}