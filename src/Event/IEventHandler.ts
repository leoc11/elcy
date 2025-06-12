export type IEventDispacher<TArgs = unknown> = (args?: TArgs) => void;
export interface IEventHandler<TSource, TArgs = unknown> {
    add(handler: (source: TSource, args: TArgs) => boolean | void): void;
    delete(handler: (source: TSource, args: TArgs) => boolean | void): void;
}
