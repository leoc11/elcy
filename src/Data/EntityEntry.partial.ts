import { EntityEntry } from "./EntityEntry";
import { IChangeEventParam } from "../MetaData/Interface/IChangeEventParam";
import { EmbeddedRelationMetaData } from "../MetaData/EmbeddedColumnMetaData";
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";
import { EntityState } from "./EntityState";

declare module "./EntityEntry" {
    interface EntityEntry<T> {
        onPropertyChanged(entity: T, param: IChangeEventParam<T>): void;
    }
}
// TODO: protected
EntityEntry.prototype.onPropertyChanged = function <T>(this: EntityEntry<T>, entity: T, param: IChangeEventParam<T>) {
    if (this.dbSet.primaryKeys.contains(param.column)) {
        // primary key changed, update dbset entry dictionary.
        const oldKey = this.key;
        this.dbSet.updateEntryKey(this);

        // TODO: cascade update issue
        // update all relation refer to this entity.
        for (const prop in this.relationMap) {
            const relationGroup = this.relationMap[prop];
            if (!relationGroup)
                continue;

            for (const [, relation] of relationGroup) {
                const entry = relation.masterEntry === this ? relation.slaveEntry : relation.masterEntry;
                entry.updateRelationKey(relation, oldKey);
            }
        }
    }

    if (param.oldValue !== param.newValue && param.column instanceof EmbeddedRelationMetaData) {
        const embeddedDbSet = this.dbSet.dbContext.set(param.column.target.type);
        new EmbeddedEntityEntry(embeddedDbSet, param.newValue, this);
    }

    if (this.enableTrackChanges && (this.state === EntityState.Modified || this.state === EntityState.Unchanged) && param.oldValue !== param.newValue) {
        const oriValue = this.originalValues.get(param.column.propertyName);
        if (oriValue === param.newValue) {
            this.originalValues.delete(param.column.propertyName);
            if (this.originalValues.size <= 0) {
                this.state = EntityState.Unchanged;
            }
        }
        else if (oriValue === undefined && param.oldValue !== undefined && !param.column.isReadOnly) {
            this.originalValues.set(param.column.propertyName, param.oldValue);
            if (this.state === EntityState.Unchanged) {
                this.state = EntityState.Modified;
            }
        }
    }
};