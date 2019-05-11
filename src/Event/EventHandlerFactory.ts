import { IEventHandler, IEventDispacher } from "./IEventHandler";

export const EventHandlerFactory = <TSource, TArgs = any>(source: TSource, stopOnFalse = false): [IEventHandler<TSource, TArgs>, IEventDispacher<TArgs>] => {
    const handlers: any[] = [];
    const eventHandler: IEventHandler<TSource, TArgs> = {
        add: (handler) => {
            handlers.push(handler);
        },
        delete: (handler) => {
            handlers.delete(handler);
        }
    };
    const eventDispacher = function (args: TArgs) {
        for (const handler of handlers) {
            if (handler(source, args) === false && stopOnFalse) break;
        }
    };

    return [eventHandler, eventDispacher];
};
