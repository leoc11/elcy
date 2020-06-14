export enum RelationState {
    Detached = 0,
    Unchanged = 1 << 0,
    Added = 1 << 1,
    Deleted = 1 << 2
}
