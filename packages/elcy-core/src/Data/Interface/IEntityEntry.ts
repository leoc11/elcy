import { EntityState } from "../EntityState";

export interface IEntityEntry<T = unknown> {
    entity: T;
    state: EntityState;
}
