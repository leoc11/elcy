import { orderDirection } from "../../Common/Type";

export interface IOrderCondition {
    property: string;
    direction: orderDirection;
}
