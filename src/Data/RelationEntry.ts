import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { EntityEntry } from "./EntityEntry";
import { EntityState } from "./EntityState";

export class RelationEntry<TE1 = any, TE2 = any, TRD = any> {
    private _state: EntityState;
    public get state() {
        return this._state;
    }
    public set state(value) {
        if (this._state !== value) {
            let requireAttach = false;
            const dbContext = this.slaveEntry.dbSet.dbContext;
            switch (this.state) {
                case EntityState.Added: {
                    const typedAddEntries = dbContext.relationEntries.add.get(this.slaveRelation);
                    if (typedAddEntries) {
                        typedAddEntries.delete(this);
                    }
                    break;
                }
                case EntityState.Deleted: {
                    const typedEntries = dbContext.relationEntries.delete.get(this.slaveRelation);
                    if (typedEntries) {
                        typedEntries.delete(this);
                    }
                    break;
                }
                case EntityState.Detached: {
                    requireAttach = true;
                    break;
                }
            }
            switch (value) {
                case EntityState.Added: {
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
                case EntityState.Deleted: {
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
                case EntityState.Detached: {
                    this.split(true);
                    break;
                }
                case EntityState.Deleted: {
                    this.split();
                    break;
                }
                default: {
                    this.join(requireAttach);
                    break;
                }
            }
        }
    }
    constructor(public slaveEntry: EntityEntry<TE1>, public masterEntry: EntityEntry<TE2>, public slaveRelation: IRelationMetaData<TE1, TE2>, public relationData?: TRD) {
        this._state = EntityState.Detached;
    }

    public join(isAttach = false) {
        if (isAttach) {
            let relGroup = this.slaveEntry.relationMap[this.slaveRelation.fullName];
            if (!relGroup) {
                relGroup = new Map();
                this.slaveEntry.relationMap[this.slaveRelation.fullName] = relGroup;
            }
            relGroup.set(this.masterEntry, this);

            relGroup = this.masterEntry.relationMap[this.slaveRelation.fullName];
            if (!relGroup) {
                relGroup = new Map();
                this.masterEntry.relationMap[this.slaveRelation.fullName] = relGroup;
            }
            relGroup.set(this.slaveEntry, this);
        }

        // apply slave relation property
        if (this.slaveRelation.relationType === "one") {
            this.slaveEntry.entity[this.slaveRelation.propertyName] = this.masterEntry.entity as any;
        }
        else {
            let relationVal: any[] = this.slaveEntry.entity[this.slaveRelation.propertyName] as any;
            if (!Array.isArray(relationVal)) {
                relationVal = [];
                this.slaveEntry.entity[this.slaveRelation.propertyName] = relationVal as any;
            }
            relationVal.add(this.masterEntry.entity);
        }

        // apply master relation property
        const masterRelation = this.slaveRelation.reverseRelation;
        if (masterRelation.relationType === "one") {
            this.masterEntry.entity[masterRelation.propertyName] = this.slaveEntry.entity as unknown as TE2[keyof TE2];
        }
        else {
            let relationVal = this.masterEntry.entity[masterRelation.propertyName] as unknown as TE1[];
            if (!Array.isArray(relationVal)) {
                relationVal = [];
                this.masterEntry.entity[masterRelation.propertyName] = relationVal as any;
            }
            relationVal.add(this.slaveEntry.entity);
        }

        if (this.slaveRelation.completeRelationType !== "many-many") {
            const cols = this.slaveRelation.mappedRelationColumns.where((o) => !!o.propertyName);
            for (const col of cols) {
                const reverseProperty = this.slaveRelation.relationMaps.get(col).propertyName as keyof TE2;
                if (reverseProperty) {
                    const value = this.masterEntry.entity[reverseProperty] as any;
                    this.slaveEntry.entity[col.propertyName] = value;
                }
            }
        }
    }
    public split(isDetach = false) {
        if (isDetach) {
            this.slaveEntry.relationMap[this.slaveRelation.fullName].delete(this.masterEntry);
            this.masterEntry.relationMap[this.slaveRelation.fullName].delete(this.slaveEntry);
        }

        // detach slave relation property
        if (this.slaveRelation.relationType === "one") {
            this.slaveEntry.entity[this.slaveRelation.propertyName] = null;
        }
        else {
            const relationVal: any[] = this.slaveEntry.entity[this.slaveRelation.propertyName] as any;
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
            const relationVal: any[] = this.masterEntry.entity[masterRelation.propertyName] as any;
            if (Array.isArray(relationVal)) {
                relationVal.delete(this.slaveEntry.entity);
            }
        }

        const cols = this.slaveRelation.mappedRelationColumns.where((o) => !!o.propertyName);
        for (const col of cols) {
            this.slaveEntry.entity[col.propertyName] = null;
        }
    }

    public acceptChanges() {
        switch (this.state) {
            case EntityState.Added: {
                this.state = EntityState.Unchanged;
                break;
            }
            case EntityState.Deleted:
            case EntityState.Detached: {
                this.state = EntityState.Detached;
                break;
            }
        }
    }

    public add() {
        this.state = this.state === EntityState.Deleted ? EntityState.Unchanged : EntityState.Added;
    }
    public delete() {
        this.state = this.state === EntityState.Added || this.state === EntityState.Detached ? EntityState.Detached : EntityState.Deleted;
    }
}
