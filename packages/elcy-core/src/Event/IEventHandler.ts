export type IEventDispacher<TArgs = unknown> = (args?: TArgs) => void;
export interface IEventHandler<TSource, TArgs = unknown> {
    add(handler: (source: TSource, args: TArgs) => boolean | void): void;
    delete(handler: (source: TSource, args: TArgs) => boolean | void): void;
}

export interface IEventEmitter<TSource, TArgs = unknown> {
    isEmpty(): boolean;
    clear(): void;
    add(handler: (source: TSource, args: TArgs) => boolean | void): void;
    remove(handler: (source: TSource, args: TArgs) => boolean | void): void;
    emit(args?: TArgs): void;
}

export interface IAsyncEventEmitter<TSource, TArgs = unknown> {
    isEmpty(): boolean;
    clear(): void;
    add(handler: (source: TSource, args: TArgs) => Promise<boolean> | Promise<void>): void;
    remove(handler: (source: TSource, args: TArgs) => Promise<boolean> | Promise<void>): void;
    emit(args?: TArgs): Promise<void>;
}