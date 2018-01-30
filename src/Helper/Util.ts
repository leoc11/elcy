import { GenericType } from "../Common/Type";

export const isValueType = <T>(type: GenericType<T>) => {
    return [Number, String, Date].contains(type as any);
}