// tslint:disable-next-line:no-namespace
export const FunctionHelper = {
    PropertyName<T>(propertySelector: (item: T) => any): keyof T {
        const ptopstr = propertySelector.toString();
        return ptopstr.substr(ptopstr.lastIndexOf(".") + 1) as keyof T;
    }
};
