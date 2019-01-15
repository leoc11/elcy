import { OrderDirection, ValueType } from "../../Common/Type";

export interface IOrderDefinition<T = any> {
    0: (source: T) => ValueType; // TODO: use PropertySelector<T>
    1?: OrderDirection;
}