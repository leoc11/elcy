import { Enumerable } from "@elcy/enumerable";
import { IEventEmitter } from "src/Event/IEventHandler";
import { isEqual } from "src/Helper/Util";
import { IChangeEventParam } from "src/MetaData/Interface/IChangeEventParam";
import { eventEmitterFactory } from "src/Event/EventHandlerFactory";
import { IObjectType } from "src/Common/Type";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";

export const trackMap = new WeakMap<object, IEventEmitter<any, IChangeEventParam<any>>>();
export function trackEntity<T extends object>(entity: T, handler: (source: T, args: IChangeEventParam<T>) => boolean | void) {
    let eventEmitter = trackMap.get(entity) as IEventEmitter<T, IChangeEventParam<T>>;
    if (!eventEmitter) {
        eventEmitter = eventEmitterFactory(entity);
        trackMap.set(entity, eventEmitter);
    }

    eventEmitter.add(handler);
}
export function untrackEntity<T extends object>(entity: T, handler: (source: T, args: IChangeEventParam<T>) => boolean | void) {
    let eventEmitter = trackMap.get(entity) as IEventEmitter<T, IChangeEventParam<T>>;
    if (!eventEmitter) {
        eventEmitter = eventEmitterFactory(entity);
        trackMap.set(entity, eventEmitter);
    }

    eventEmitter.remove(handler);
}
export function proxyEntityType<TE extends object>(type: IObjectType<TE>, columns: IColumnMetaData<TE, any>[]): IObjectType<TE> {
    const columnMetaMap = Enumerable.from(columns).toMap(o => o.propertyName as (string | symbol));

    const proxyType = new Proxy(type, {
        construct(target, args, newTarget) {
            const instance = Reflect.construct(target, args, newTarget);
            const proxyInstance = new Proxy(instance, {
                get(target, prop, receiver) {
                    if (prop === "constructor") {
                        return proxyType;
                    }
                    return Reflect.get(target, prop, receiver);
                },
                set(target, prop, val, receiver) {
                    const m = trackMap.get(proxyInstance) as unknown as IEventEmitter<TE, IChangeEventParam<TE>>;
                    if (m) {
                        const oldValue = Reflect.get(target, prop, receiver);
                        const result = Reflect.set(target, prop, val, receiver);
                        if (!isEqual(oldValue, val)) {
                            m.emit({
                                newValue: val,
                                oldValue: oldValue,
                                column: columnMetaMap.get(prop)
                            });
                        }
                        return result;
                    }
                    else {
                        return Reflect.set(target, prop, val, receiver);
                    }
                }
            });

            return proxyInstance;
        }
    });
    return proxyType;
}