import { OrderDirection, PropertySelector } from "../../Common/Type";

export interface IOrderDefinition<T = any> {
    0: PropertySelector<T>;
    1?: OrderDirection;
}