import { EntityState } from "../EntityState";

export interface IEntityEntryOption {
    isCompletelyLoaded?: boolean;
    state: EntityState;
}
