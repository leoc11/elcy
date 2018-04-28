import { EventListener } from "../../Common/EventListener";
import { DbSet } from "../DbSet";
import { IChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";

export class EntityEntry<T = any> implements IEntityEntryOption {
    public state: EntityState;
    constructor(protected dbSet: DbSet<T>, public entity: T) {
        this.state = EntityState.Unchanged;
        const eventListener = new EventListener(entity);
        Reflect.defineMetadata("PropertyChangeEventListener", eventListener, entity);
        eventListener.add(this.propertyChangedHandler.bind(this), 0);
    }
    public get isCompletelyLoaded() {
        return this.dbSet.metaData.properties.all(o => (this.entity as any)[o] !== undefined);
    }
    private originalValues: Map<string, any> = new Map();
    public isPropertyModified(prop: string) {
        return this.originalValues.has(prop);
    }
    public getOriginalValue(prop: string) {
        return this.originalValues.get(prop);
    }
    public propertyChangedHandler(param: IChangeEventParam) {
        if ((this.state === EntityState.Modified || this.state === EntityState.Unchanged) && param.oldValue !== param.newValue) {
            const oriValue = this.originalValues.get(param.property);
            if (oriValue === param.newValue) {
                this.originalValues.delete(param.property);
                if (this.originalValues.size <= 0) {
                    this.state = EntityState.Unchanged;
                    this.dbSet.dbContext.modifiedEntities.remove(this);
                }
            }
            else if (oriValue === undefined && param.oldValue !== undefined) {
                this.originalValues.set(param.property, param.oldValue);
                if (this.state === EntityState.Unchanged) {
                    this.dbSet.dbContext.changeState(this, EntityState.Modified);
                }
            }
        }
    }
    public reset(...properties: string[]) {
        if (properties) {
            for (const prop of properties) {
                if (this.originalValues.has(prop))
                    (this.entity as any)[prop] = this.originalValues.get(prop);
            }
        }
        else {
            for (const [prop, value] of this.originalValues) {
                if (!properties || properties.contains(prop))
                    (this.entity as any)[prop] = value;
            }
        }
    }
    public setUnchanged(...properties: string[]) {
        if (properties) {
            for (const prop of properties)
                this.originalValues.delete(prop);
        }
        else {
            this.originalValues.clear();
        }
        if (this.originalValues.size === 0) {
            this.dbSet.dbContext.changeState(this, EntityState.Unchanged);
        }
    }
    public setOriginalValues(originalValues: { [key: string]: any }) {
        for (const prop in originalValues) {
            this.originalValues.set(prop, originalValues[prop]);
        }
        // TODO: check whether entity really is modified.
        this.state = EntityState.Modified;
    }
}

export interface IEntityEntryOption {
    isCompletelyLoaded?: boolean;
    state: EntityState;
}

export enum EntityState {
    Added,
    Unchanged,
    Modified,
    Deleted
}