import { EventListener } from "../Common/EventListener";
import { DbSet } from "./DbSet";
import { EntityEntry } from "./EntityEntry";
import { IChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { EmbeddedColumnMetaData } from "../MetaData";
import { EntityState } from "./EntityState";

export class EmbeddedEntityEntry<T = any, TP = any> extends EntityEntry<T> {
    private listenerId: number;
    public column: EmbeddedColumnMetaData<TP, T>;
    constructor(public dbSet: DbSet<T>, public entity: T, public parentEntry: EntityEntry<TP>) {
        super(dbSet, entity, null);
        const eventListener = new EventListener(entity);
        Reflect.defineMetadata("PropertyChangeEventListener", eventListener, entity);
        eventListener.add(this.onPropertyChanged.bind(this), 0);

        const changeListener: EventListener<IChangeEventParam> = Reflect.getOwnMetadata("PropertyChangeEventListener", parentEntry.entity);
        if (changeListener) {
            this.listenerId = changeListener.add(this.onParentPropertyChange.bind(this));
        }
    }
    private onParentPropertyChange(param: IChangeEventParam<TP, T>) {
        if (param.column === this.column) {
            if (param.oldValue === this.entity) {
                const parentChangeListener: EventListener<IChangeEventParam> = Reflect.getOwnMetadata("PropertyChangeEventListener", this.parentEntry.entity);
                if (parentChangeListener) {
                    parentChangeListener.remove(this.listenerId);
                }
                this.changeState(EntityState.Detached);
            }
        }
    }
}
