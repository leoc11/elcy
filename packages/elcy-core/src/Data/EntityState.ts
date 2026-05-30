export enum EntityState {
    Detached = 0,
    Added = 1 << 0,
    Unchanged = 1 << 1,
    Modified = 1 << 2,
    Deleted = 1 << 3
}
