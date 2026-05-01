import { StringKeyOf } from "../Common/Type";

// tslint:disable-next-line:no-namespace
export const FunctionHelper = {
    propertyName<T>(propertySelector: (item: T) => unknown): StringKeyOf<T> {
        const ptopstr = propertySelector.toString();
        return ptopstr.substring(ptopstr.lastIndexOf(".") + 1) as StringKeyOf<T>;
    }
};
