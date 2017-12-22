// tslint:disable-next-line:no-namespace
namespace FunctionHelper {
    export function PropertyName<T>(propertySelector: (item: T) => any): keyof T {
        return propertySelector.toString() as keyof T;
    }
}
