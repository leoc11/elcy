import { GenericType, ValueType } from "../Common/Type";

export const isValue = (data: any): data is ValueType => {
    return [Number, String, Date].contains(data.constructor);
};
export const isValueType = <T>(type: GenericType<T>) => {
    return [Number, String, Date].contains(type as any);
};
export const isNativeFunction = (fn: Function) => {
    return fn.toString().indexOf("=>") < 0 && !("prototype" in fn);
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
/**
 * 
 * @param str source: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
export const hashCode = (str: string, hash: number = 0) => {
    if (str.length === 0)
        return hash;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + charCode;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};