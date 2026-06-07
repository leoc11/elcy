import { OrderDirection } from "./Type";

export interface IOrderDefinition<T = unknown> {
  0: (source: T) => unknown;
  1?: OrderDirection;
}
