import { EntityState } from "./EntityState";
import { EntityEntry } from "./EntityEntry";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";

export class RelationEntry<TE1 = any, TE2 = any, TRD = any> {
    public state: EntityState;
    constructor(public slaveEntry: EntityEntry<TE1>, public masterEntry: EntityEntry<TE2>, public slaveRelation: IRelationMetaData<TE1, TE2>, public relationData?: TRD) {
        this.state = EntityState.Unchanged;
    }
    public changeState(state: EntityState) {
        this.masterEntry.dbSet.dbContext.changeRelationState(this, state);
    }
    public acceptChanges() {
        if (this.state === EntityState.Added) {
            const cols = this.slaveRelation.mappedRelationColumns;
            if (cols.count() > 0) {
                cols.each(col => {
                    const reverseProperty = this.slaveRelation.relationMaps.get(col).propertyName as keyof TE2;
                    const value = this.masterEntry.entity[reverseProperty] as any;
                    this.slaveEntry.entity[col.propertyName] = value;
                });
            }
        }
        else if (this.state === EntityState.Deleted) {
            if (this.slaveRelation.relationType === "one") {
                if (this.slaveRelation.nullable) {
                    this.slaveRelation.relationColumns.each(col => {
                        this.slaveEntry.entity[col.propertyName] = null;
                    });
                }
                else {
                    // if not nullable, then delete slave entity.
                    this.masterEntry.entity[this.slaveRelation.reverseRelation.propertyName] = null;
                }
            }
            else {
                const relDatas: any[] = this.slaveEntry.entity[this.slaveRelation.propertyName] as any;
                relDatas.remove(this.masterEntry.entity);

                if (this.slaveRelation.reverseRelation.relationType === "many") {
                    const masterRelDatas: any[] = this.masterEntry.entity[this.slaveRelation.reverseRelation.propertyName] as any;
                    masterRelDatas.remove(this.slaveEntry.entity);
                }
                else {
                    this.masterEntry.entity[this.slaveRelation.reverseRelation.propertyName] = null;
                }
            }
            this.masterEntry.removeRelation(this);
            this.slaveEntry.removeRelation(this);
        }
        this.changeState(EntityState.Unchanged);
    }
}
