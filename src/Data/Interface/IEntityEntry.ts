import { EntityState } from "../EntityState";

export interface IEntityEntryOption<T> {
    isCompletelyLoaded?: boolean;
    state: EntityState;
    entity: T;
}
