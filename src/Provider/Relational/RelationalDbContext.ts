import { DbType, DeleteMode } from "../../Common/StringType";
import { DbContext } from "../../Data/DbContext";
import { EntityEntry } from "../../Data/EntityEntry";
import { EntityState } from "../../Data/EntityState";
import { RelationEntry } from "../../Data/RelationEntry";
import { RelationState } from "../../Data/RelationState";
import { Enumerable } from "../../Enumerable/Enumerable";
import { isNull } from "../../Helper/Util";
import { DeleteDeferredQuery } from "../../Query/DeferredQuery/DeleteDeferredQuery";
import { InsertDeferredQuery } from "../../Query/DeferredQuery/InsertDeferredQuery";
import { RelationAddDeferredQuery } from "../../Query/DeferredQuery/RelationAddDeferredQuery";
import { RelationDeleteDeferredQuery } from "../../Query/DeferredQuery/RelationDeleteDeferredQuery";
import { UpdateDeferredQuery } from "../../Query/DeferredQuery/UpdateDeferredQuery";
import { UpsertDeferredQuery } from "../../Query/DeferredQuery/UpsertDeferredQuery";
import { IQueryOption } from "../../Query/IQueryOption";

export abstract class RelationalDbContext<TDB extends DbType> extends DbContext<TDB> {
    public async saveChanges(options?: IQueryOption): Promise<number> {
        const addEntries = this.entityEntries.add.asEnumerable().orderBy([(o) => o[0].hasIncrementPrimary, "DESC"], [(o) => o[0].priority, "ASC"]);
        const updateEntries = this.entityEntries.update.asEnumerable().orderBy([(o) => o[0].priority, "ASC"]);
        const deleteEntries = this.entityEntries.delete.asEnumerable().orderBy([(o) => o[0].priority, "DESC"]);
        const relAddEntries = this.relationEntries.add.asEnumerable().orderBy([(o) => o[0].source.priority, "ASC"]);
        const relDeleteEntries = this.relationEntries.delete.asEnumerable().orderBy([(o) => o[0].source.priority, "DESC"]);

        let result = 0;
        // execute all in transaction;
        await this.transaction(async () => {
            const entryMap = new Map<EntityEntry, any>();
            const relEntryMap = new Map<RelationEntry, any>();

            const defers: Array<UpsertDeferredQuery<any> | InsertDeferredQuery<any>
                | UpdateDeferredQuery<any> | DeleteDeferredQuery<any>
                | RelationAddDeferredQuery<any, any, any> | RelationDeleteDeferredQuery<any, any, any>> = [];
            for (const [meta, entries] of addEntries) {
                const insertDefers: Array<UpsertDeferredQuery<any> | InsertDeferredQuery<any>> = [];
                for (const entry of entries) {
                    const nd = options && options.useUpsert ? this.getUpsertQuery(entry) : this.getInsertQuery(entry);
                    // Don't finalize result here. coz it will be used later for update/insert related entities
                    nd.autoFinalize = false;
                    insertDefers.push(nd);
                    defers.push(nd);
                    if (entryMap.has(entry)) {
                        nd.relationId = entryMap.get(entry);
                        entryMap.delete(entry);
                    }
                }
                if (!meta.hasIncrementPrimary) {
                    continue;
                }
                await this.executeDeferred();
                for (const defer of insertDefers) {
                    for (const relName in defer.entry.relationMap) {
                        const relMap = defer.entry.relationMap[relName];
                        for (const [a, b] of relMap) {
                            if (a.state === EntityState.Added) {
                                const relId = {};
                                for (const [sCol, mCol] of b.slaveRelation.relationMaps) {
                                    if (!isNull(defer.data[mCol.propertyName])) {
                                        relId[sCol.propertyName] = defer.data[mCol.propertyName];
                                    }
                                }
                                entryMap.set(a, relId);
                            }
                            else if (b.state === RelationState.Added) {
                                const relId = {};
                                for (const [sCol, mCol] of b.slaveRelation.relationMaps) {
                                    if (!isNull(defer.data[mCol.propertyName])) {
                                        relId[sCol.propertyName] = defer.data[mCol.propertyName];
                                    }
                                }
                                relEntryMap.set(b, relId);
                            }
                        }
                    }
                }
            }
            for (const [, entries] of updateEntries) {
                for (const entry of entries) {
                    const nd = options && options.useUpsert ? this.getUpsertQuery(entry) : this.getUpdateQuery(entry);
                    defers.push(nd);
                }
            }
            for (const [, entries] of relAddEntries) {
                // Filter out new relation with Added slave entity,
                // coz relation has been set at insert query.
                for (const entry of entries
                    .where((o) => !(o.slaveRelation.relationType === "one" && o.slaveEntry.state === EntityState.Added))) {
                    const nd = this.getRelationAddQuery(entry);
                    defers.push(nd);
                }
            }
            for (const [, entries] of relDeleteEntries) {
                // Filter out deleted relation that have related new relation,
                // coz relation have been replaced.
                const filteredEntries = entries
                    .where((o) => o.masterEntry.state !== EntityState.Detached && o.slaveEntry.state !== EntityState.Detached)
                    .where((o) => {
                        if (o.slaveRelation.completeRelationType !== "many-many") {
                            const relGroup = o.slaveEntry.relationMap[o.slaveRelation.propertyName];
                            if (relGroup != null) {
                                return !Enumerable.from(relGroup).any(([, relEntry]) => relEntry.state === RelationState.Added);
                            }
                        }
                        return true;
                    });
                for (const entry of filteredEntries) {
                    const nd = this.getRelationDeleteQuery(entry);
                    defers.push(nd);
                }
            }
            for (const [entityMeta, entries] of deleteEntries) {
                const deleteMode: DeleteMode = options && options.forceHardDelete || !entityMeta.deletedColumn ? "hard" : "soft";

                for (const entry of entries) {
                    const nd = this.getDeleteQuery(entry, deleteMode);
                    defers.push(nd);
                }
            }

            await this.executeDeferred();
            for (const defer of defers) {
                defer.finalize();
                result += defer.value;
            }
        });

        return result;
    }

    public getDeleteQuery<T>(entry: EntityEntry<T>, deleteMode?: DeleteMode) {
        return new DeleteDeferredQuery(entry, deleteMode);
    }
    public getInsertQuery<T>(entry: EntityEntry<T>) {
        return new InsertDeferredQuery(entry);
    }
    public getRelationAddQuery<T, T2, TData>(relationEntry: RelationEntry<T, T2, TData>) {
        return new RelationAddDeferredQuery(relationEntry);
    }
    public getRelationDeleteQuery<T, T2, TData>(relationEntry: RelationEntry<T, T2, TData>) {
        return new RelationDeleteDeferredQuery(relationEntry);
    }
    public getUpdateQuery<T>(entry: EntityEntry<T>) {
        return new UpdateDeferredQuery(entry);
    }
    public getUpsertQuery<T>(entry: EntityEntry<T>) {
        return new UpsertDeferredQuery(entry);
    }
}
