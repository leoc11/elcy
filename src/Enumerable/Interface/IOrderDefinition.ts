import { OrderDirection, ValueType } from "../../Common/Type";

export interface IOrderDefinition<T = any> {
    // TODO: use PropertySelector<T>
    0: (source: T) => ValueType;
    1?: OrderDirection;
}
