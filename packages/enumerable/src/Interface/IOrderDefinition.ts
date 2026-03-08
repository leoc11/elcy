import { OrderDirection } from "./Type";

export interface IOrderDefinition<T = unknown> {
    // TODO: use PropertySelector<T>
    0: (source: T) => unknown;
    1?: OrderDirection;
}
