export interface IEntityEntry<T> extends IEntityEntryOption {
    entity: T;
}

export interface IEntityEntryOption {
    loadTime: Date;
}