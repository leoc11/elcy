import type { StringKeyOf } from "../Common/Type";
import { Enumerable } from "../Enumerable/Enumerable";
import { hasFlags, isNotNull } from "../Helper/Util";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { EntityEntry } from "./EntityEntry";
import { EntityState } from "./EntityState";
import { RelationState } from "./RelationState";

export class RelationEntry<TE1 extends object = object, TE2 extends object = object, TRD extends object = object> {
    public get state() {
        return this._state;
    }
    public set state(value) {
        if (this._state !== value) {
            const dbContext = this.slaveEntry.dbSet.dbContext;
            switch (this.state) {
                case RelationState.Added: {
                    const typedAddEntries = dbContext.relationEntries.add.get(this.slaveRelation);
                    if (typedAddEntries) {
                        typedAddEntries.delete(this);
                    }
                    break;
                }
                case RelationState.Deleted: {
                    const typedEntries = dbContext.relationEntries.delete.get(this.slaveRelation);
                    if (typedEntries) {
                        typedEntries.delete(this);
                    }
                    break;
                }
                case RelationState.Detached: {
                    if (this.masterEntry.state === EntityState.Detached) {
                        this.masterEntry.state = EntityState.Unchanged;
                    }
                    if (this.slaveEntry.state === EntityState.Detached) {
                        this.slaveEntry.state = EntityState.Unchanged;
                    }
                    break;
                }
            }
            switch (value) {
                case RelationState.Added: {
                    let typedEntries = dbContext.relationEntries.add.get(this.slaveRelation);
                    if (!typedEntries) {
                        typedEntries = [];
                        dbContext.relationEntries.add.set(this.slaveRelation, typedEntries);
                    }
                    typedEntries.push(this);
                    if (this.slaveEntry.state === EntityState.Deleted) {
                        this.slaveEntry.state = EntityState.Unchanged;
                    }
                    if (this.masterEntry.state === EntityState.Deleted) {
                        this.masterEntry.state = EntityState.Unchanged;
                    }
                    break;
                }
                case RelationState.Deleted: {
                    let typedEntries = dbContext.relationEntries.delete.get(this.slaveRelation);
                    if (!typedEntries) {
                        typedEntries = [];
                        dbContext.relationEntries.delete.set(this.slaveRelation, typedEntries);
                    }
                    typedEntries.push(this);
                    break;
                }
            }
            this._state = value;
            switch (value) {
                case RelationState.Detached: {
                    const srelMap = this.slaveEntry.relationMap[this.slaveRelation.propertyName] as unknown as Map<EntityEntry<TE2>, unknown>;
                    if (srelMap) {
                        srelMap.delete(this.masterEntry);
                    }
                    const mrelMap = this.masterEntry.relationMap[this.slaveRelation.reverseRelation.propertyName] as unknown as Map<EntityEntry<TE1>, unknown>;
                    if (mrelMap) {
                        mrelMap.delete(this.slaveEntry);
                    }

                    this.split();
                    break;
                }
                case RelationState.Deleted: {
                    this.split();
                    break;
                }
                default: {
                    this.join();
                    break;
                }
            }
        }
    }
    constructor(public slaveEntry: EntityEntry<TE1>, public masterEntry: EntityEntry<TE2>, public slaveRelation: IRelationMetaData<TE1, TE2>, public relationData?: TRD) {
        let isDetached = true;
        const state = slaveEntry.state | masterEntry.state;
        if (!hasFlags(state, EntityState.Added | EntityState.Detached)) {
            isDetached = Enumerable.from(slaveRelation.relationMaps).any(([col, masterCol]) => {
                const oVal = slaveEntry.getOriginalValue(col.propertyName);
                return !isNotNull(oVal) || oVal !== masterEntry.getOriginalValue(masterCol.propertyName);
            });
        }
        this._state = isDetached ? RelationState.Detached : RelationState.Unchanged;
    }
    private _state: RelationState;

    public acceptChanges() {
        switch (this.state) {
            case RelationState.Added: {
                this.state = RelationState.Unchanged;
                break;
            }
            case RelationState.Deleted:
            case RelationState.Detached: {
                this.state = RelationState.Detached;
                break;
            }
        }
    }

    public add() {
        this.state = this.state === RelationState.Deleted ? RelationState.Unchanged : RelationState.Added;
    }
    public delete() {
        this.state = this.state === RelationState.Added || this.state === RelationState.Detached ? RelationState.Detached : RelationState.Deleted;
    }

    public join() {
        // apply slave relation property
        if (this.slaveRelation.relationType === "one") {
            this.slaveEntry.entity[this.slaveRelation.propertyName] = this.masterEntry.entity as TE1[StringKeyOf<TE1>];
        }
        else {
            let relationVal = this.slaveEntry.entity[this.slaveRelation.propertyName] as TE1[StringKeyOf<TE1>] | TE2[];
            if (!Array.isArray(relationVal)) {
                relationVal = [];
                this.slaveEntry.entity[this.slaveRelation.propertyName] = relationVal as TE1[StringKeyOf<TE1>];
            }
            relationVal.add(this.masterEntry.entity);
        }

        // apply master relation property
        const masterRelation = this.slaveRelation.reverseRelation;
        if (masterRelation.relationType === "one") {
            this.masterEntry.entity[masterRelation.propertyName] = this.slaveEntry.entity as TE2[StringKeyOf<TE2>];
        }
        else {
            let relationVal = this.masterEntry.entity[masterRelation.propertyName] as TE2[StringKeyOf<TE2>] | TE1[];
            if (!Array.isArray(relationVal)) {
                relationVal = [];
                this.masterEntry.entity[masterRelation.propertyName] = relationVal as TE2[StringKeyOf<TE2>];
            }
            relationVal.add(this.slaveEntry.entity);
        }

        if (this.slaveRelation.completeRelationType !== "many-many") {
            const cols = this.slaveRelation.mappedRelationColumns.where((o) => !!o.propertyName);
            for (const col of cols) {
                const reverseProperty = this.slaveRelation.relationMaps.get(col).propertyName;
                if (reverseProperty) {
                    const value = this.masterEntry.entity[reverseProperty];
                    this.slaveEntry.entity[col.propertyName] = value as unknown as TE1[StringKeyOf<TE1>];
                }
            }
        }
    }
    public split() {
        // detach slave relation property
        if (this.slaveRelation.relationType === "one") {
            this.slaveEntry.entity[this.slaveRelation.propertyName] = null;
        }
        else {
            const relationVal = this.slaveEntry.entity[this.slaveRelation.propertyName] as TE2[];
            if (Array.isArray(relationVal)) {
                relationVal.delete(this.masterEntry.entity);
            }
        }

        // detach master relation property
        const masterRelation = this.slaveRelation.reverseRelation;
        if (masterRelation.relationType === "one") {
            this.masterEntry.entity[masterRelation.propertyName] = null;
        }
        else {
            const relationVal = this.masterEntry.entity[masterRelation.propertyName] as TE1[];
            if (Array.isArray(relationVal)) {
                relationVal.delete(this.slaveEntry.entity);
            }
        }

        // NOTE: POSSIBLE REMOVED
        if (this.slaveRelation.relationType === "one") {
            const cols = this.slaveRelation.mappedRelationColumns.where((o) => !o.isPrimaryColumn && !!o.propertyName);
            for (const col of cols) {
                this.slaveEntry.entity[col.propertyName] = null;
            }
        }
    }
}
