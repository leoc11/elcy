import { EventListener } from "../../Common/EventListener";
import { DbSet } from "../DbSet";
import { IChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";

export class EntityEntry<T = any> implements IEntityEntryOption {
    public state: EntityState;
    public enableTrackChanges = true;
    constructor(protected dbSet: DbSet<T>, public entity: T, public key: string) {
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
        if (this.dbSet.primaryKeys.contains(param.property as any)) {
            // primary key changed, update dbset entry dictionary
            this.dbSet.updateEntryKey(this);
        }
        if (this.enableTrackChanges && (this.state === EntityState.Modified || this.state === EntityState.Unchanged) && param.oldValue !== param.newValue) {
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
    public resetChanges(...properties: string[]) {
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
    public acceptChanges(...properties: string[]) {
        if (properties) {
            for (const prop of properties)
                this.originalValues.delete(prop);
        }
        else {
            this.originalValues.clear();
        }
        if (this.originalValues.size <= 0) {
            this.changeState(EntityState.Unchanged);
        }
    }
    public setOriginalValues(originalValues: { [key: string]: any }) {
        for (const prop in originalValues) {
            const value = originalValues[prop];
            this.setOriginalValue(prop as any, value);
        }
        this.changeState(this.originalValues.size > 0 ? EntityState.Modified : EntityState.Unchanged);
    }
    public changeState(state: EntityState) {
        this.dbSet.dbContext.changeState(this, state);
    }
    public setOriginalValue(property: keyof T, value: any) {
        if (!(property in this.entity))
            return;
        if (this.entity[property] === value)
            this.originalValues.delete(property);
        else if (this.isPropertyModified(property)) {
            this.originalValues.set(property, value);
        }
        else {
            this.enableTrackChanges = false;
            this.entity[property] = value;
            this.enableTrackChanges = true;
        }
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