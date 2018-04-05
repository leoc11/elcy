import { GenericType, ValueType } from "../Common/Type";

export const isValue = (data: any): data is ValueType => {
    return [Number, String, Date].contains(data.constructor);
};
export const isValueType = <T>(type: GenericType<T>) => {
    return [Number, String, Date].contains(type as any);
};
export const isNativeFunction = (fn: Function) => {
    return !("prototype" in fn);
};
// export const toTimezone = (date: Date, targetTimezoneOffset: number, sourceTimezoneOffset?: number) => {
//     sourceTimezoneOffset = sourceTimezoneOffset !== undefined ? sourceTimezoneOffset : date.getTimezoneOffset();
//     date = date.
// }
export const fillZero = (value: number, factor = 2): string => {
    const isNegative = value < 0;
    if (isNegative) value = Math.abs(value);
    return (isNegative ? "-" : "") + (("0").repeat(factor - 1) + value).slice(-factor);
};
