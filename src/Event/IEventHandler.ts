export interface IEventDispacher<TArgs = any> {
    (args?: TArgs): void;
}
export interface IEventHandler<TSource, TArgs = any> {
    add(handler: (source: TSource, args: TArgs) => boolean | void): void;
    delete(handler: (source: TSource, args: TArgs) => boolean | void): void;
}
