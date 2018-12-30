import { IOrderDefinition } from "../../Enumerable/Interface/IOrderDefinition";

export interface IEntityOption<T> {
    name?: string;
    defaultOrders?: IOrderDefinition<T>[];
    allowInheritance?: boolean;
}
