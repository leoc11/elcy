import { OrderDirection } from "../../Common/Type";

export interface IOrderOption<TE = any> {
    property?: keyof TE;
    direction: OrderDirection;
}
