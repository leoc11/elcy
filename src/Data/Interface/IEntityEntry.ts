import { EventListener } from "../../Common/EventListener";
import { DbSet } from "../DbSet";

export class EntityEntry<T = any> implements IEntityEntryOption {
    public state: EntityState;
    constructor(protected dbSet: DbSet<T>, public entity: T, protected columns: string[] = [], public loadTime: Date) {
        if (!this.loadTime)
            this.loadTime = new Date();

        const eventListener = new EventListener(entity);
        Reflect.set(entity as any, "PropertyChangeEventListener", eventListener);
        eventListener.add(this.propertyChangedHandler.bind(this), 0);
    }
    // TODO: must check only non-computed column and navigation property
    public get isCompletelyLoaded() {
        return this.columns.all(o => (this.entity as any)[o] !== undefined);
    }
    private originalValues: Map<string, any> = new Map();
    public isPropertyModified(prop: string) {
        return this.originalValues.has(prop);
    }
    public getOriginalValue(prop: string) {
        return this.originalValues.get(prop);
    }
    public propertyChangedHandler(propertyName: string, oldValue: any, newValue: any) {
        if ((this.state === EntityState.Modified || this.state === EntityState.Unchanged) && oldValue !== newValue) {
            const oriValue = this.originalValues.get(propertyName);
            if (oriValue === newValue) {
                this.originalValues.delete(propertyName);
                if (this.originalValues.size <= 0) {
                    this.state = EntityState.Unchanged;
                    this.dbSet.dbContext.modifiedEntities.remove(this);
                }
            }
            else if (oriValue === undefined && oldValue !== undefined) {
                this.originalValues.set(propertyName, oldValue);
                if (this.state === EntityState.Unchanged) {
                    this.dbSet.dbContext.changeState(this, EntityState.Modified);
                }
            }
        }
    }
}

export interface IEntityEntryOption {
    loadTime: Date;
    isCompletelyLoaded?: boolean;
    state: EntityState;
}

export enum EntityState {
    Added,
    Unchanged,
    Modified,
    Deleted
}