import { OrderDirection } from "../../Common/Type";

export interface IOrderCondition {
    property: string;
    direction: OrderDirection;
}
