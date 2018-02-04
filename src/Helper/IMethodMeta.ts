import { GenericType } from "../Common/Type";

export interface IMethodMeta {
    name: string;
    returnType: GenericType;
    isSupported: boolean;
}
