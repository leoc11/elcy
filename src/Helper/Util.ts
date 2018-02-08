import { GenericType, ValueType } from "../Common/Type";

export const isValueType = <T>(type: GenericType<T>) => {
    return [Number, String, Date].contains(type as any);
};
export const isNativeFunction = (fn: Function) => {
    return !("prototype" in fn);
};
