export interface IGroupArray<T, TKey> extends Array<T> {
    [key: string]: unknown;
    key: TKey;
}
