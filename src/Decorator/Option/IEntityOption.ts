import { IOrderDefinition } from "../../Enumerable/Interface/IOrderDefinition";

export interface IEntityOption<T> {
    name?: string;
    defaultOrders?: Array<IOrderDefinition<T>>;
    allowInheritance?: boolean;
}
