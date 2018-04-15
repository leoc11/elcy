import { OrderDirection, ValueType } from "../../Common/Type";

export interface IOrderDefinition<T = any> {
    selector: ((o: T) => ValueType);
    direction?: OrderDirection;
}
