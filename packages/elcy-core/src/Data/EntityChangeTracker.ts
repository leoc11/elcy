import { Enumerable } from "@elcy/enumerable";
import { IEventEmitter } from "src/Event/IEventHandler";
import { isEqual, isIterable, isNull, isValue } from "src/Helper/Util";
import { IChangeEventParam } from "src/MetaData/Interface/IChangeEventParam";
import { eventEmitterFactory } from "src/Event/EventHandlerFactory";
import { IObjectType, StringKeyOf } from "src/Common/Type";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";
import { getEntityMetadata } from "src/MetaData/MetaDataMapper";
import { IRelationMetaData } from "src/MetaData/Interface/IRelationMetaData";
import { ArrayExtension } from "src/Extensions/ArrayExtension";

export const proxyArrayMap = new WeakMap<any[], any[]>();
export const trackMap = new WeakMap<object, IEventEmitter<unknown, IChangeEventParam>>();
export const relationValueMap = new WeakMap<object, Map<string | symbol, unknown[]>>();

export function trackEntity<TE extends object>(entity: TE, handler: (this: TE, ...args: IChangeEventParam) => boolean | void) {
    let eventEmitter = trackMap.get(entity) as IEventEmitter<TE, IChangeEventParam>;
    if (!eventEmitter) {
        eventEmitter = eventEmitterFactory(entity);
        trackMap.set(entity, eventEmitter);
    }

    eventEmitter.add(handler);
}
export function untrackEntity<TE extends object>(entity: TE, handler: (this: TE, ...args: IChangeEventParam) => boolean | void) {
    let eventEmitter = trackMap.get(entity) as IEventEmitter<TE, IChangeEventParam>;
    if (!eventEmitter) {
        eventEmitter = eventEmitterFactory(entity);
        trackMap.set(entity, eventEmitter);
    }

    eventEmitter.remove(handler);
}

export function proxyEntityType<TE extends object>(type: IObjectType<TE>): IObjectType<TE> {
    let columnMetaMap: { [K in keyof TE]?: IColumnMetaData<TE> };
    let relationMetaMap: Map<string | symbol, IRelationMetaData<TE, any>>;

    function getColumnMetaMap() {
        if (!columnMetaMap) {
            const entityMeta = getEntityMetadata(proxyType);
            if (!entityMeta) {
                return undefined;
            }
            columnMetaMap = entityMeta.properties;
        }
        return columnMetaMap;
    }
    function getRelationMetaMap() {
        if (!relationMetaMap) {
            const entityMeta = getEntityMetadata(proxyType);
            if (!entityMeta) {
                return undefined;
            }
            relationMetaMap = Enumerable.from(entityMeta.relations).toMap(o => o.propertyName as (string | symbol));
        }
        return relationMetaMap;
    }

    function toJSON(this: TE, seen?: WeakSet<object>) {
        if (!seen) {
            seen = new WeakSet();
        }
        seen.add(this);
        const jsonObj: Partial<TE> = {};
        const relationObj: Partial<TE> = {};
        const relationMap = getRelationMetaMap();
        for (const prop in this) {
            if (!relationMap.has(prop)) {
                jsonObj[prop] = this[prop];
                continue;
            }

            const value = this[prop] as any;
            if (value === undefined || typeof value === "function") {
                continue;
            }
            if (isNull(value) || seen.has(value)) {
                jsonObj[prop] = null;
                continue;
            }
            if (isValue(value)) {
                jsonObj[prop] = this[prop];
                continue;
            }

            seen.add(value);
            if (isIterable(value)) {
                relationObj[prop] = Array.from(value) as any;
                for (const item of value) {
                    if (!item || isValue(item)) {
                        continue;
                    }

                    if (typeof item === "object") {
                        seen.add(item);
                    }
                }
            }
            else {
                relationObj[prop] = value;
            }
        }
        for (const prop in relationObj) {
            const value = relationObj[prop];
            if (isIterable(value)) {
                const items = [] as TE[StringKeyOf<TE>] & unknown[];
                for (const itemValue of value) {
                    let item = itemValue as any;
                    if (typeof item?.toJSON === "function") {
                        item = item.toJSON(seen);
                    }
                    items.push(item);
                }
                jsonObj[prop] = items;
            }
            else {
                let item = value as any;
                if (typeof item?.toJSON === "function") {
                    item = item.toJSON(seen);
                }

                jsonObj[prop] = item;
            }
        }
        return jsonObj;
    };

    const proxyType = new Proxy(type, {
        construct(target, args, newTarget) {
            const instance: TE = Reflect.construct(target, args, newTarget);
            const proxyInstance = new Proxy(instance, {
                get(target, prop) {
                    switch (prop) {
                        case "constructor": return proxyType;
                        case "toJSON": return toJSON;
                    }

                    const relation = getRelationMetaMap()?.get(prop);
                    if (relation?.relationType === "many") {
                        let relValueMap = relationValueMap.get(this);
                        if (!relValueMap) {
                            relValueMap = new Map();
                            relationValueMap.set(this, relValueMap);
                        }
                        let value = relValueMap.get(prop);
                        if (!value) {
                            const targetValue = Reflect.get(target, prop, target) as any[] ?? [];
                            const m = trackMap.get(proxyInstance);
                            value = trackRelationArray(targetValue, (added, removed) => {
                                m.emit(relation, added, removed);
                            });
                            relValueMap.set(prop, value);
                        }

                        return value;
                    }

                    return Reflect.get(target, prop, target);
                },
                set(target, prop, val) {
                    const m = trackMap.get(proxyInstance) as unknown as IEventEmitter<TE, IChangeEventParam>;
                    if (!m) {
                        return Reflect.set(target, prop, val, target);
                    }

                    const column = getColumnMetaMap()?.[prop as keyof TE];
                    if (column) {
                        const oldValue = Reflect.get(target, prop, target);
                        const result = Reflect.set(target, prop, val, target);
                        if (result && !isEqual(oldValue, val)) {
                            m.emit(column, val, oldValue);
                        }
                        return result;
                    }

                    const relation = getRelationMetaMap()?.get(prop);
                    if (relation) {
                        if (relation.relationType === "many") {
                            const unproxyVal = proxyArrayMap.get(val) ?? val;
                            return Reflect.set(target, prop, unproxyVal, target);
                        }
                        else {
                            const oldValue = Reflect.get(target, prop, target);
                            const result = Reflect.set(target, prop, val, target);
                            if (result && !isEqual(oldValue, val)) {
                                const newValues = isNull(val) ? [] : [val];
                                const oldValues = isNull(oldValue) ? [] : [oldValue];
                                m.emit(relation, newValues, oldValues);
                            }
                            return result;
                        }
                    }

                    return Reflect.set(target, prop, val, target);
                }
            });

            return proxyInstance;
        }
    });

    return proxyType;
}

function trackRelationArray<T = unknown>(initialArray: T[], onChange: (added: T[], removed: T[]) => void): T[] {
    // We use this flag to stop the `set` trap from firing 
    // while a method like `splice` is moving elements around.
    let isMethodMutating = false;

    const proxy = new Proxy(initialArray, {
        get(target, prop, receiver) {
            const targetValue = Reflect.get(target, prop, receiver);

            // 1. Intercept Array Methods
            if (typeof targetValue === 'function') {
                const method = String(prop);
                const mutatorMethods = ['push', 'pop', 'shift', 'unshift', 'splice'];

                if (mutatorMethods.includes(method)) {
                    return function (...args: any[]) {
                        isMethodMutating = true;
                        const result = targetValue.apply(target, args); // Run the real method
                        isMethodMutating = false;

                        let added: T[] = [];
                        let removed: T[] = [];

                        // Calculate what changed based on the method used
                        if (method === 'push' || method === 'unshift') {
                            added = args;
                        }
                        else if (method === 'pop' || method === 'shift') {
                            if (result !== undefined) removed = [result];
                        }
                        else if (method === 'splice') {
                            added = args.slice(2); // Any arguments after start/deleteCount are added items
                            removed = result;      // splice conveniently returns an array of removed items!
                        }

                        if (removed.length) {
                            // remove item that still exist in array
                            ArrayExtension.delete(removed, ...target);
                        }

                        if (added.length > 0 || removed.length > 0) {
                            onChange(added, removed);
                        }

                        return result;
                    };
                }
            }
            return targetValue;
        },

        // 2. Intercept Direct Assignments (e.g., arr[0] = 'New')
        set(target, prop, value, receiver) {
            const index = Number(prop);
            // Only track if a method isn't currently running, and ignore the 'length' property
            if (isMethodMutating || isNaN(index)) {
                return Reflect.set(target, prop, value, receiver);
            }

            if (prop === "length") {
                // TODO.
            }

            const oldVal = target[index];
            const added = [value];
            const removed = oldVal !== undefined ? [oldVal] : [];

            const success = Reflect.set(target, prop, value, receiver);
            if (success) {
                onChange(added, removed);
            }
            return success;
        },

        // 3. Intercept Direct Deletions (e.g., delete arr[0])
        deleteProperty(target, prop) {
            const index = Number(prop);
            if (isMethodMutating || isNaN(index)) {
                return Reflect.deleteProperty(target, prop);
            }

            const oldVal = target[index];
            const removed = oldVal !== undefined ? [oldVal] : [];

            const success = Reflect.deleteProperty(target, prop);
            if (success && removed.length > 0) {
                onChange([], removed);
            }

            return success;
        }
    });

    proxyArrayMap.set(proxy, initialArray);
    return proxy;
}