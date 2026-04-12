import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { IChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { DbSet } from "./DbSet";
import { EntityEntry } from "./EntityEntry";
import { EntityState } from "./EntityState";
import { trackEntity, untrackEntity } from "./EntityChangeTracker";

export class EmbeddedEntityEntry<T extends object = object, TP extends object = object> extends EntityEntry<T> {
    public override get state() {
        return super.state;
    }
    public override set state(value) {
        if (super.state !== value) {
            const dbContext = this.dbSet.dbContext;
            const isModified = (this.state === EntityState.Detached || this.state === EntityState.Unchanged) && !(value === EntityState.Detached || value === EntityState.Unchanged);
            const isUnchanged = !(this.state === EntityState.Detached || this.state === EntityState.Unchanged) && (value === EntityState.Detached || value === EntityState.Unchanged);
            if (isUnchanged) {
                const embeddedEntries = dbContext.modifiedEmbeddedEntries.get(this.metaData);
                if (embeddedEntries) {
                    ArrayExtension.delete(embeddedEntries, this);
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
    constructor(dbSet: DbSet<T>, entity: T, public parentEntry: EntityEntry<TP>) {
        super(dbSet, entity, null);
        trackEntity(parentEntry.entity, this.onParentPropertyChange);
    }
    public column: IColumnMetaData<TP, T>;
    private onParentPropertyChange = (...[metadata, newValue, oldValue]: IChangeEventParam<TP, T>) => {
        if (metadata === this.column) {
            if (oldValue === this.entity) {
                untrackEntity(this.parentEntry.entity, this.onParentPropertyChange);
                this.state = EntityState.Detached;
            }
        }
    }
}
