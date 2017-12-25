export interface IGroupArray<TKey, TType> extends Array<TType> {
    [key: string]: any;
    key?: TKey;
}
