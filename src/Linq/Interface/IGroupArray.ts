export interface IGroupArray<TType, TKey> extends Array<TType> {
    [key: string]: any;
    key?: TKey;
}
