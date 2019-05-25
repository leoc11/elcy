import { IOrderDefinition } from "../../Enumerable/Interface/IOrderDefinition";

export interface IEntityOption<T> {
    allowInheritance?: boolean;
    defaultOrders?: Array<IOrderDefinition<T>>;
    name?: string;
}
