import { DbSet } from "./DbSet";
import { EntityEntry } from "./EntityEntry";
import { IChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { EmbeddedRelationMetaData } from "../MetaData/EmbeddedColumnMetaData";
import { EntityState } from "./EntityState";
import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventHandler } from "../Event/IEventHandler";
import { propertyChangeHandlerMetaKey, propertyChangeDispatherMetaKey } from "../Decorator/DecoratorKey";

export class EmbeddedEntityEntry<T = any, TP = any> extends EntityEntry<T> {
    public column: EmbeddedRelationMetaData<TP, T>;
    constructor(public dbSet: DbSet<T>, public entity: T, public parentEntry: EntityEntry<TP>) {
        super(dbSet, entity, null);
        let propertyChangeHandler: IEventHandler<T> = entity[propertyChangeHandlerMetaKey];
        if (!propertyChangeHandler) {
            let propertyChangeDispatcher: any;
            [propertyChangeHandler, propertyChangeDispatcher] = EventHandlerFactory<T, IChangeEventParam<T>>(entity);
            entity[propertyChangeHandlerMetaKey] = propertyChangeHandler;
            entity[propertyChangeDispatherMetaKey] = propertyChangeDispatcher;
        }
        propertyChangeHandler.add(this.onPropertyChanged);

        let parentPropertyChangeHandler: IEventHandler<TP> = parentEntry.entity[propertyChangeHandlerMetaKey];
        if (!parentPropertyChangeHandler) {
            parentPropertyChangeHandler.add(this.onParentPropertyChange);
        }
    }

    public get state() {
        return super.state;
    }
    public set state(value) {
        if (super.state !== value) {
            const dbContext = this.dbSet.dbContext;
            const isModified = (this.state === EntityState.Detached || this.state === EntityState.Unchanged) && !(value === EntityState.Detached || value === EntityState.Unchanged);
            const isUnchanged = !(this.state === EntityState.Detached || this.state === EntityState.Unchanged) && (value === EntityState.Detached || value === EntityState.Unchanged);
            if (isUnchanged) {
                const embeddedEntries = dbContext.modifiedEmbeddedEntries.get(this.metaData);
                if (embeddedEntries)
                    embeddedEntries.delete(this);
            }
            else if (isModified) {
                let typedEntries = dbContext.modifiedEmbeddedEntries.get(this.metaData);
                if (!typedEntries) {
                    typedEntries = [];
                    dbContext.modifiedEmbeddedEntries.set(this.metaData, typedEntries);
                }
                typedEntries.push(this);
            }
        }
    }
    private onParentPropertyChange(entity: TP, param: IChangeEventParam<TP, T>) {
        if (param.column === this.column) {
            if (param.oldValue === this.entity) {
                const parentChangeHandler: IEventHandler<TP, IChangeEventParam> = this.parentEntry.entity[propertyChangeHandlerMetaKey];
                if (parentChangeHandler) {
                    parentChangeHandler.delete(this.onParentPropertyChange);
                }
                this.state = EntityState.Detached;
            }
        }
    }
}
