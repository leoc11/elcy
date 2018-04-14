export class EntityEntry<T> implements IEntityEntryOption {
    constructor(public entity: T, protected columns: string[] = [], public loadTime: Date) {
        if (!this.loadTime)
            this.loadTime = new Date();
    }
    public get isCompletelyLoaded() {
        return this.columns.all(o => (this.entity as any)[o] !== undefined);
    }
}

export interface IEntityEntryOption {
    loadTime: Date;
    isCompletelyLoaded?: boolean;
}