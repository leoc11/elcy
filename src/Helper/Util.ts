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
    let leading = "";
    let i = factor;
    const isNegative = value < 0;
    if (isNegative) value = Math.abs(value);
    while (value < Math.pow(10, --i)) leading += "0";
    return (isNegative ? "-" : "") + (leading + value).slice(-factor);
};
