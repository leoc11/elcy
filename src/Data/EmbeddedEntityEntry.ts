import { propertyChangeDispatherMetaKey, propertyChangeHandlerMetaKey } from "../Decorator/DecoratorKey";
import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventDispacher, IEventHandler } from "../Event/IEventHandler";
import { arrayDelete } from "../Helper/Util";
import { IChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { DbSet } from "./DbSet";
import { EntityEntry } from "./EntityEntry";
import { EntityState } from "./EntityState";

export class EmbeddedEntityEntry<T extends object = object, TP extends object = object> extends EntityEntry<T> {
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
                if (embeddedEntries) {
                    arrayDelete(embeddedEntries, this);
                }
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
    constructor(public dbSet: DbSet<T>, public entity: T, public parentEntry: EntityEntry<TP>) {
        super(dbSet, entity, null);
        let propertyChangeHandler = entity[propertyChangeHandlerMetaKey] as IEventHandler<T, IChangeEventParam<T>>;
        if (!propertyChangeHandler) {
            let propertyChangeDispatcher: IEventDispacher;
            [propertyChangeHandler, propertyChangeDispatcher] = EventHandlerFactory<T, IChangeEventParam<T>>(entity);
            entity[propertyChangeHandlerMetaKey] = propertyChangeHandler;
            entity[propertyChangeDispatherMetaKey] = propertyChangeDispatcher;
        }
        propertyChangeHandler.add((source, arg) => this.onPropertyChanged(arg));

        const parentPropertyChangeHandler = parentEntry.entity[propertyChangeHandlerMetaKey] as IEventHandler<TP, IChangeEventParam<TP, T>>;
        if (!parentPropertyChangeHandler) {
            parentPropertyChangeHandler.add((source, arg) => this.onParentPropertyChange(arg));
        }
    }
    public column: IColumnMetaData<TP, T>;
    private onParentPropertyChange(param: IChangeEventParam<TP, T>) {
        if (param.column === this.column) {
            if (param.oldValue === this.entity) {
                const parentChangeHandler = this.parentEntry.entity[propertyChangeHandlerMetaKey] as IEventHandler<TP, IChangeEventParam<TP, T>>;
                if (parentChangeHandler) {
                    parentChangeHandler.delete((source, arg) => this.onParentPropertyChange(arg));
                }
                this.state = EntityState.Detached;
            }
        }
    }
}
