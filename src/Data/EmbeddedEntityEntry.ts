import { propertyChangeDispatherMetaKey, propertyChangeHandlerMetaKey } from "../Decorator/DecoratorKey";
import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventDispacher, IEventHandler } from "../Event/IEventHandler";
import { IChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
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
                const embeddedEntries = dbContext.modifiedEmbeddedEntries.get(this.metaData as IEntityMetaData);
                if (embeddedEntries) {
                    embeddedEntries.delete(this as unknown as EmbeddedEntityEntry);
                }
            }
            else if (isModified) {
                let typedEntries = dbContext.modifiedEmbeddedEntries.get(this.metaData as IEntityMetaData);
                if (!typedEntries) {
                    typedEntries = [];
                    dbContext.modifiedEmbeddedEntries.set(this.metaData as IEntityMetaData, typedEntries);
                }
                typedEntries.push(this as unknown as EmbeddedEntityEntry);
            }
        }
    }
    constructor(public dbSet: DbSet<T>, public entity: T, public parentEntry: EntityEntry<TP>) {
        super(dbSet, entity, null);
        let propertyChangeHandler = entity[propertyChangeHandlerMetaKey as Extract<keyof T, symbol>] as IEventHandler<T, IChangeEventParam<T>>;
        if (!propertyChangeHandler) {
            let propertyChangeDispatcher: IEventDispacher;
            [propertyChangeHandler, propertyChangeDispatcher] = EventHandlerFactory<T, IChangeEventParam<T>>(entity);
            entity[propertyChangeHandlerMetaKey] = propertyChangeHandler;
            entity[propertyChangeDispatherMetaKey] = propertyChangeDispatcher;
        }
        propertyChangeHandler.add((source, arg) => this.onPropertyChanged(arg));

        const parentPropertyChangeHandler = parentEntry.entity[propertyChangeHandlerMetaKey as Extract<keyof TP, symbol>] as IEventHandler<TP, IChangeEventParam<TP, T>>;
        if (!parentPropertyChangeHandler) {
            parentPropertyChangeHandler.add((source, arg) => this.onParentPropertyChange(arg));
        }
    }
    public column: IColumnMetaData<TP, T>;
    private onParentPropertyChange(param: IChangeEventParam<TP, T>) {
        if (param.column === this.column) {
            if (param.oldValue === this.entity) {
                const parentChangeHandler = this.parentEntry.entity[propertyChangeHandlerMetaKey as Extract<keyof TP, symbol>] as IEventHandler<TP, IChangeEventParam<TP, T>>;
                if (parentChangeHandler) {
                    parentChangeHandler.delete((source, arg) => this.onParentPropertyChange(arg));
                }
                this.state = EntityState.Detached;
            }
        }
    }
}
