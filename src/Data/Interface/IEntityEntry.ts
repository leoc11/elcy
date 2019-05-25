import { EntityState } from "../EntityState";

export interface IEntityEntryOption<T> {
    entity: T;
    isCompletelyLoaded?: boolean;
    state: EntityState;
}
