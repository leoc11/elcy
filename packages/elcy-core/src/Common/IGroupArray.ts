export interface IGroupArray<K = unknown, T = unknown> extends Array<T> {
    [key: string]: unknown;
    key: K;
}
