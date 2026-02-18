import { ValueType } from "../../Common/Type";
import { ClassAccessor, ClassAccessorDecorator } from "../Type";

// TODO: types: Persisted, Virtual, Query
export function ComputedColumn<TE extends object = object, T extends ValueType = ValueType>(fn: (o: TE) => T): ClassAccessorDecorator<TE, T> {
    return (accessor: ClassAccessor<T>, context: ClassAccessorDecoratorContext<TE, T>) => {
        let computedColumnMap = context.metadata.computedColumnMap as Map<keyof TE, typeof fn>;
        if (!(computedColumnMap instanceof Map)) {
            context.metadata.computedColumnMap = computedColumnMap = new Map();
        }

        computedColumnMap.set(context.name as keyof TE, fn);

        return {
            get() {
                let value = accessor.get();
                if (typeof value === "undefined") {
                    value = fn(this as TE);
                    accessor.set(value);
                }

                return value;
            }
        }
    };
}
