import { OrderDirection, ValueType } from "../../Common/Type";

export interface IOrderDefinition<T = any> {
    0: ((o: T) => ValueType);
    1?: OrderDirection;
}