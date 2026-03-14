import { EntityState } from "../EntityState";

export interface IEntityEntry<T = unknown> {
    entity: T;
    isCompletelyLoaded?: boolean;
    state: EntityState;
}
