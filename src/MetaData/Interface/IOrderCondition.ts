import { orderDirection } from "../../Common/Type";

export interface IOrderCondition {
    [propertyKey: string]: orderDirection;
}
