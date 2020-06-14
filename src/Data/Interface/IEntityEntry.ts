import { EntityState } from "../EntityState";

export interface IEntityEntry<T> {
    entity: T;
    isCompletelyLoaded?: boolean;
    state: EntityState;
}
