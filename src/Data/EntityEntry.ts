import { EventListener } from "../Common/EventListener";
import { DbSet } from "./DbSet";
import { IChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { EntityState } from "./EntityState";
import { IEntityEntryOption } from "./Interface/IEntityEntry";
import { EmbeddedColumnMetaData } from "../MetaData";
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";

export class EntityEntry<T = any> implements IEntityEntryOption {
    public state: EntityState;
    public enableTrackChanges = true;
    constructor(public dbSet: DbSet<T>, public entity: T, public key: string) {
        this.state = EntityState.Unchanged;
        const eventListener = new EventListener(entity);
        Reflect.defineMetadata("PropertyChangeEventListener", eventListener, entity);
        eventListener.add(this.onPropertyChanged.bind(this), 0);
    }
    public get isCompletelyLoaded() {
        return this.dbSet.metaData.columns.all(o => (this.entity as any)[o.propertyName] !== undefined);
    }
    private originalValues: Map<string, any> = new Map();
    public isPropertyModified(prop: string) {
        return this.originalValues.has(prop);
    }
    public getOriginalValue(prop: string) {
        return this.originalValues.get(prop);
    }
    public onPropertyChanged(param: IChangeEventParam<T>) {
        if (this.dbSet.primaryKeys.contains(param.column)) {
            // primary key changed, update dbset entry dictionary
            this.dbSet.updateEntryKey(this);
        }

        if (param.oldValue !== param.newValue && param.column instanceof EmbeddedColumnMetaData) {
            const embeddedDbSet = this.dbSet.dbContext.set(param.column.type);
            new EmbeddedEntityEntry(embeddedDbSet, param.newValue, this);
        }

        if (this.enableTrackChanges && (this.state === EntityState.Modified || this.state === EntityState.Unchanged) && param.oldValue !== param.newValue) {
            const oriValue = this.originalValues.get(param.column.propertyName);
            if (oriValue === param.newValue) {
                this.originalValues.delete(param.column.propertyName);
                if (this.originalValues.size <= 0) {
                    this.changeState(EntityState.Unchanged);
                }
            }
            else if (oriValue === undefined && param.oldValue !== undefined) {
                this.originalValues.set(param.column.propertyName, param.oldValue);
                if (this.state === EntityState.Unchanged) {
                    this.changeState(EntityState.Modified);
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
        if (this.state === EntityState.Deleted) {
            this.changeState(EntityState.Unchanged);
            for (const relMeta of this.dbSet.metaData.relations) {
                let relEntities: any[] = [];
                const relProp = this.entity[relMeta.propertyName];
                if (Array.isArray(relProp))
                    relEntities = relEntities.concat(this.entity[relMeta.propertyName]);
                else if (relProp)
                    relEntities = [relProp];
                if (relMeta.reverseRelation.relationType === "one") {
                    relEntities.forEach(o => o[relMeta.reverseRelation.propertyName] = null);
                }
                else {
                    relEntities.forEach(o => o[relMeta.reverseRelation.propertyName].delete(this.entity));
                }
            }
            return;
        }

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
    public getModifiedProperties() {
        return Array.from(this.originalValues.keys());
    }
}
