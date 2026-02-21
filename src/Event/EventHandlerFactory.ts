import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { IEventDispacher, IEventEmitter, IEventHandler } from "./IEventHandler";

export const EventHandlerFactory = <TSource, TArgs = unknown>(source: TSource, stopOnFalse = false): [IEventHandler<TSource, TArgs>, IEventDispacher<TArgs>] => {
    const handlers: Array<(source: TSource, args: TArgs) => boolean | void> = [];
    const eventHandler: IEventHandler<TSource, TArgs> = {
        add: (handler) => {
            handlers.push(handler);
        },
        delete: (handler) => {
            ArrayExtension.delete(handlers, handler);
        }
    };
    const eventDispacher = function (args: TArgs) {
        for (const handler of handlers) {
            if (handler(source, args) === false && stopOnFalse) {
                break;
            }
        }
    };

    return [eventHandler, eventDispacher];
};

export const eventEmitterFactory = <TSource, TArgs = unknown>(source: TSource, stopOnFalse = false): IEventEmitter<TSource, TArgs> => {
    const handlers = new Set<(source: TSource, args: TArgs) => boolean | void>();
    return {
        add: (handler) => {
            handlers.add(handler);
        },
        remove: (handler) => {
            handlers.delete(handler);
        },
        emit: (args: TArgs) => {
            for (const handler of handlers) {
                if (handler(source, args) === false && stopOnFalse) {
                    break;
                }
            }
        }
    };
};
