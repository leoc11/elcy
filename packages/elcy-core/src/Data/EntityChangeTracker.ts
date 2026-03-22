import { Enumerable } from "@elcy/enumerable";
import { IEventEmitter } from "src/Event/IEventHandler";
import { isEqual } from "src/Helper/Util";
import { IChangeEventParam } from "src/MetaData/Interface/IChangeEventParam";
import { eventEmitterFactory } from "src/Event/EventHandlerFactory";
import { IObjectType, ValueType } from "src/Common/Type";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";
import { getEntityMetadata } from "src/MetaData/MetaDataMapper";

export const trackMap = new WeakMap<object, IEventEmitter<unknown, IChangeEventParam<any, unknown>>>();
export function trackEntity<TE extends object, T = ValueType>(entity: TE, handler: (source: TE, args: IChangeEventParam<TE, T>) => boolean | void) {
    let eventEmitter = trackMap.get(entity) as IEventEmitter<TE, IChangeEventParam<TE, T>>;
    if (!eventEmitter) {
        eventEmitter = eventEmitterFactory(entity);
        trackMap.set(entity, eventEmitter);
    }

    eventEmitter.add(handler);
}
export function untrackEntity<TE extends object, T = ValueType>(entity: TE, handler: (source: TE, args: IChangeEventParam<TE, T>) => boolean | void) {
    let eventEmitter = trackMap.get(entity) as IEventEmitter<TE, IChangeEventParam<TE, T>>;
    if (!eventEmitter) {
        eventEmitter = eventEmitterFactory(entity);
        trackMap.set(entity, eventEmitter);
    }

    eventEmitter.remove(handler);
}
export function proxyEntityType<TE extends object>(type: IObjectType<TE>): IObjectType<TE> {
    let columnMetaMap: Map<string | symbol, IColumnMetaData<TE, any>>;

    const proxyType = new Proxy(type, {
        construct(target, args, newTarget) {
            const instance = Reflect.construct(target, args, newTarget);
            const proxyInstance = new Proxy(instance, {
                get(target, prop) {
                    if (prop === "constructor") {
                        return proxyType;
                    }
                    return Reflect.get(target, prop, target);
                },
                set(target, prop, val) {
                    const m = trackMap.get(proxyInstance) as unknown as IEventEmitter<TE, IChangeEventParam<TE>>;
                    if (!m) {
                        return Reflect.set(target, prop, val, target);
                    }

                    if (!(columnMetaMap instanceof Map)) {
                        const entityMeta = getEntityMetadata(proxyType);
                        columnMetaMap = Enumerable.from(entityMeta.columns).toMap(o => o.propertyName as (string | symbol));
                    }

                    const column = columnMetaMap.get(prop);
                    if (!column) {
                        return Reflect.set(target, prop, val, target);
                    }

                    const oldValue = Reflect.get(target, prop, target);
                    const result = Reflect.set(target, prop, val, target);
                    if (!isEqual(oldValue, val)) {
                        m.emit({
                            newValue: val,
                            oldValue: oldValue,
                            column: column
                        });
                    }
                    return result;
                }
            });

            return proxyInstance;
        }
    });
    return proxyType;
}