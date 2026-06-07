import type { GenericType, IObjectType, PrimitiveType } from "src/Common/Type";

export const VALUE_TYPES = new Map<GenericType, unknown>();
export const registerValueType = <T>(type: GenericType<T>, defaultInstance: T) => {
    VALUE_TYPES.set(type, defaultInstance);
}

export function tryCreateInstance<T>(type: PrimitiveType<T>): T;
export function tryCreateInstance<T>(type: GenericType<T>): T;
export function tryCreateInstance<T>(type: GenericType<T>): T {
    if (VALUE_TYPES.has(type)) {
        return VALUE_TYPES.get(type) as T;
    }

    try {
        return new (type as IObjectType<T>)();
    } catch { }
    try {
        return (type as PrimitiveType<T>)();
    } catch { }

    return undefined;
}
