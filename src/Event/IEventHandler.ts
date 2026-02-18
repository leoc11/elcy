export type IEventDispacher<TArgs = unknown> = (args?: TArgs) => void;
export interface IEventHandler<TSource, TArgs = unknown> {
    add(handler: (source: TSource, args: TArgs) => boolean | void): void;
    delete(handler: (source: TSource, args: TArgs) => boolean | void): void;
}

export interface IEventEmitter<TSource, TArgs = unknown> {
    add(handler: (source: TSource, args: TArgs) => boolean | void): void;
    remove(handler: (source: TSource, args: TArgs) => boolean | void): void;
    emit(args?: TArgs): void;
}