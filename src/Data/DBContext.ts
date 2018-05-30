import { IObjectType, OrderDirection } from "../Common/Type";
import { DbSet } from "./DbSet";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { IQueryResultParser } from "../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryCacheManager } from "../QueryBuilder/IQueryCacheManager";
import { DefaultQueryCacheManager } from "../QueryBuilder/DefaultQueryCacheManager";
import { QueryCache } from "../QueryBuilder/QueryCache";
import { IQueryResult } from "../QueryBuilder/QueryResult";
import { ParameterBuilder } from "../QueryBuilder/ParameterBuilder/ParameterBuilder";
import { IDBEventListener } from "./Event/IDBEventListener";
import { ISaveEventParam, IDeleteEventParam, IEntityMetaData } from "../MetaData/Interface";
import { IDriver } from "../Driver/IDriver";
import { IQueryCommand } from "../QueryBuilder/Interface/IQueryCommand";
import { DBEventEmitter } from "./Event/DbEventEmitter";
import { EntityState } from "./EntityState";
import { EntityEntry } from "./EntityEntry";
import { DeferredQuery } from "../QueryBuilder/DeferredQuery";
import { Enumerable } from "../Enumerable";
import { SchemaBuilder } from "./SchemaBuilder";
import { RelationEntry } from "./RelationEntry";
import { NumericColumnMetaData } from "../MetaData";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
export type IChangeEntryMap<T extends string, TKey, TValue> = { [K in T]: Map<TKey, TValue[]> };
export abstract class DbContext implements IDBEventListener<any> {
    public abstract readonly entityTypes: Array<IObjectType<any>>;
    public abstract readonly queryBuilder: IObjectType<QueryBuilder>;
    public abstract readonly schemaBuilder: IObjectType<SchemaBuilder>;
    public abstract readonly queryParser: IObjectType<IQueryResultParser>;
    public deferredQueries: DeferredQuery[] = [];
    public get database() {
        return this.driver.database;
    }
    public readonly queryCacheManagerType?: IObjectType<IQueryCacheManager>;
    private _queryCacheManager: IQueryCacheManager;
    protected get queryCacheManager() {
        if (!this._queryCacheManager)
            this._queryCacheManager = this.queryCacheManagerType ? new this.queryCacheManagerType() : new DefaultQueryCacheManager();

        return this._queryCacheManager;
    }
    public getQueryChache<T>(key: number): Promise<QueryCache<T> | undefined> {
        return this.queryCacheManager.get<T>(this.constructor as any, key);
    }
    public setQueryChache<T>(key: number, queryCommands: IQueryCommand[], queryParser: IQueryResultParser<T>, parameterBuilder: ParameterBuilder): Promise<void> {
        return this.queryCacheManager.set<T>(this.constructor as any, key, queryCommands, queryParser, parameterBuilder);
    }
    protected cachedDbSets: Map<IObjectType, DbSet<any>> = new Map();
    constructor(protected readonly driver: IDriver) {
        this.relationEntries = {
            add: new Map(),
            delete: new Map()
        };
        this.entityEntries = {
            add: new Map(),
            update: new Map(),
            delete: new Map()
        };
    }
    public set<T>(type: IObjectType<T>, isClearCache = false): DbSet<T> {
        let result: DbSet<T> = isClearCache ? undefined as any : this.cachedDbSets.get(type);
        if (!result && this.entityTypes.contains(type)) {
            result = new DbSet(type, this);
            this.cachedDbSets.set(type, result);
        }
        return result;
    }
    public attach<T>(entity: T) {
        const set = this.set(entity.constructor as any);
        if (set) {
            return set.attach(entity);
        }
        return undefined;
    }
    public entry<T>(entity: T) {
        const set = this.set(entity.constructor as any);
        if (set) {
            return set.entry(entity);
        }
        return undefined;
    }
    public add<T>(entity: T) {
        const entry = this.attach(entity);
        if (entry) {
            this.changeState(entry, EntityState.Added);
            return true;
        }
        return false;
    }
    public delete<T>(entity: T) {
        const entry = this.attach(entity);
        if (entry) {
            this.changeState(entry, EntityState.Deleted);
            return true;
        }
        return false;
    }
    public update<T>(entity: T, originalValues: any) {
        const entry = this.attach(entity);
        if (entry) {
            if (originalValues instanceof Object)
                entry.setOriginalValues(originalValues);
            this.changeState(entry, EntityState.Modified);
            return true;
        }
        return false;
    }
    public changeState(entityEntry: EntityEntry, state: EntityState) {
        if (entityEntry.state === state)
            return;

        switch (entityEntry.state) {
            case EntityState.Added: {
                const typedAddEntries = this.entityEntries.add.get(entityEntry.metaData);
                if (typedAddEntries)
                    typedAddEntries.remove(entityEntry);
                if (state === EntityState.Deleted)
                    state = EntityState.Detached;
                break;
            }
            case EntityState.Deleted: {
                const typedEntries = this.entityEntries.delete.get(entityEntry.metaData);
                if (typedEntries)
                    typedEntries.remove(entityEntry);
                if (state === EntityState.Added)
                    state = EntityState.Detached;
                break;
            }
            case EntityState.Modified: {
                const typedEntries = this.entityEntries.update.get(entityEntry.metaData);
                if (typedEntries)
                    typedEntries.remove(entityEntry);
                break;
            }
            case EntityState.Detached:
                if (state === EntityState.Deleted)
                    state = EntityState.Detached;
                break;
        }
        switch (state) {
            case EntityState.Added: {
                let typedEntries = this.entityEntries.add.get(entityEntry.metaData);
                if (!typedEntries) {
                    typedEntries = [];
                    this.entityEntries.add.set(entityEntry.metaData, typedEntries);
                }
                typedEntries.push(entityEntry);
            }
                break;
            case EntityState.Deleted: {
                let typedEntries = this.entityEntries.delete.get(entityEntry.metaData);
                if (!typedEntries) {
                    typedEntries = [];
                    this.entityEntries.delete.set(entityEntry.metaData, typedEntries);
                }
                typedEntries.push(entityEntry);
                break;
            }
            case EntityState.Modified: {
                let typedEntries = this.entityEntries.update.get(entityEntry.metaData);
                if (!typedEntries) {
                    typedEntries = [];
                    this.entityEntries.update.set(entityEntry.metaData, typedEntries);
                }
                typedEntries.push(entityEntry);
                break;
            }
        }
        entityEntry.state = state;
    }
    public changeRelationState(relationEntry: RelationEntry, state: EntityState) {
        if (relationEntry.state === state)
            return;

        switch (relationEntry.state) {
            case EntityState.Added: {
                const typedAddEntries = this.relationEntries.add.get(relationEntry.slaveRelation);
                if (typedAddEntries)
                    typedAddEntries.remove(relationEntry);
                if (state === EntityState.Deleted)
                    state = EntityState.Detached;
                break;
            }
            case EntityState.Deleted: {
                const typedEntries = this.relationEntries.delete.get(relationEntry.slaveRelation);
                if (typedEntries)
                    typedEntries.remove(relationEntry);
                if (state === EntityState.Added)
                    state = EntityState.Detached;
                break;
            }
            case EntityState.Detached:
                if (state === EntityState.Deleted)
                    state = EntityState.Detached;
                break;
        }
        switch (state) {
            case EntityState.Added: {
                let typedEntries = this.relationEntries.add.get(relationEntry.slaveRelation);
                if (!typedEntries) {
                    typedEntries = [];
                    this.relationEntries.add.set(relationEntry.slaveRelation, typedEntries);
                }
                typedEntries.push(relationEntry);
                break;
            }
            case EntityState.Deleted: {
                let typedEntries = this.relationEntries.delete.get(relationEntry.slaveRelation);
                if (!typedEntries) {
                    typedEntries = [];
                    this.relationEntries.delete.set(relationEntry.slaveRelation, typedEntries);
                }
                typedEntries.push(relationEntry);
                break;
            }
        }
        relationEntry.state = state;
    }
    public entityEntries: IChangeEntryMap<"add" | "update" | "delete", IEntityMetaData, EntityEntry>;
    public relationEntries: IChangeEntryMap<"add" | "delete", IRelationMetaData, RelationEntry>;
    public clear() {
        this.relationEntries.add.clear();
        this.relationEntries.delete.clear();
        this.entityEntries.delete.clear();
        this.entityEntries.add.clear();
        this.entityEntries.update.clear();
        for (const [, dbSet] of this.cachedDbSets) {
            dbSet.clear();
        }
    }
    public async executeQuery(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]> {
        return await this.driver.executeQuery(query, parameters);
    }
    public async executeCommands(queryCommands: IQueryCommand[], parameters?: Map<string, any>): Promise<IQueryResult[]> {
        const mergedCommands = this.mergeQueries(queryCommands);
        let results: IQueryResult[] = [];
        for (const query of mergedCommands) {
            if (parameters)
                query.parameters = query.parameters ? new Map([...query.parameters, ...parameters]) : parameters;

            const res = await this.driver.executeQuery(query.query, query.parameters);
            results = results.concat(res);
        }

        return results;
    }
    public async transaction(transactionBody: () => Promise<void>): Promise<void> {
        try {
            await this.driver.startTransaction();
            await transactionBody();
            await this.driver.commitTransaction();
        }
        catch (e) {
            await this.driver.rollbackTransaction();
            throw e;
        }
    }
    public async saveChanges(): Promise<number> {
        let queries: IQueryCommand[] = [];
        const queryBuilder = new this.queryBuilder();

        const insertQueries: Map<IEntityMetaData, IQueryCommand[]> = new Map();
        const relationAddQueries: Map<IEntityMetaData, IQueryCommand[]> = new Map();
        let updateQueries: IQueryCommand[] = [];
        let relationDeleteQueries: IQueryCommand[] = [];
        let deleteQueries: IQueryCommand[] = [];

        // order by priority
        const orderedEntityAdd = this.entityEntries.add.asEnumerable().orderBy([o => o[0].priority, OrderDirection.ASC]);
        const orderedEntityUpdate = this.entityEntries.update.asEnumerable().orderBy([o => o[0].priority, OrderDirection.ASC]);
        const orderedEntityDelete = this.entityEntries.delete.asEnumerable().orderBy([o => o[0].priority, OrderDirection.ASC]);

        const orderedRelationAdd = this.relationEntries.add.asEnumerable().orderBy([o => o[0].source.priority, OrderDirection.ASC]);
        const orderedRelationDelete = this.relationEntries.delete.asEnumerable().orderBy([o => o[0].source.priority, OrderDirection.DESC]);

        // Before add event and generate query
        orderedEntityAdd.each(([metaData, addEntries]) => {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of addEntries) {
                eventEmitter.emitBeforeSaveEvent(entry.entity, { type: "insert" });
            }
            const insertResult = queryBuilder.getInsertQueries(metaData, addEntries);
            insertQueries.set(metaData, insertResult);
        });

        // Before update event and generate query
        orderedEntityUpdate.each(([metaData, updateEntries]) => {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of updateEntries) {
                eventEmitter.emitBeforeSaveEvent(entry.entity, { type: "update" });
            }
            updateQueries = updateQueries.concat(queryBuilder.getUpdateQueries(metaData, updateEntries));
        });

        // generate add relation here.
        orderedRelationAdd.each(([relMetaData, addEntries]) => {
            const entries = addEntries.where(o => o.masterEntry.state !== EntityState.Detached &&
                o.slaveEntry.state !== EntityState.Detached);
            relationAddQueries.set(relMetaData.source, queryBuilder.getRelationAddQueries(relMetaData.source, entries));
        });

        // generate remove relation here.
        orderedRelationDelete.each(([relMetaData, deleteEntries]) => {
            // TODO: this is only for RDBMS so need to refactor.
            // TODO: delete relation will also delete metadata for RDBMS

            // if it relation entity is not yet persisted/tracked, then this relation not valid, so skip
            // NOTE: possible remove relation from detached entry.
            const entries = deleteEntries.where(o => o.masterEntry.state !== EntityState.Detached &&
                o.slaveEntry.state !== EntityState.Detached);
            relationDeleteQueries = relationDeleteQueries.concat(queryBuilder.getRelationDeleteQueries(relMetaData.source, entries));
        });

        // Before delete even and generate query
        orderedEntityDelete.each(([metaData, deleteEntries]) => {
            const eventEmitter = new DBEventEmitter(this, metaData);
            // TODO: soft delete or hard delete.
            // TODO: for non RDMS, implement cascade delete manually
            for (const entry of deleteEntries) {
                eventEmitter.emitBeforeDeleteEvent(entry.entity, { type: "soft" });
            }
            deleteQueries = deleteQueries.concat(queryBuilder.getDeleteQueries(metaData, deleteEntries));
        });

        queries = queries.concat(updateQueries)
            .concat(relationAddQueries.asEnumerable().selectMany(o => o[1]).toArray()).concat(relationDeleteQueries)
            .concat(deleteQueries);

        const mergedQueries = this.mergeQueries(queries);
        let results: IQueryResult[];

        // execute all in transaction;
        await this.transaction(async () => {
            // execute all insert
            for (const [meta, queries] of insertQueries) {
                const mergedQueries = this.mergeQueries(queries);
                for (const query of mergedQueries) {
                    const res = await this.executeQuery(query.query, query.parameters);
                    const generatedPrimaryCols = meta.primaryKeys.where(o => !!o.default || (o as NumericColumnMetaData).autoIncrement);
                    if (generatedPrimaryCols.count() > 0) {
                        // TODO: need refactor
                        const datas = res.selectMany(o => o.rows).toArray();
                        const paramKey = `__${meta.name}_`;
                        const masterRelations = meta.relations.where(o => o.isMaster);
                        for (const relation of masterRelations) {
                            const targetInsertQueries = insertQueries.get(relation.target);
                            const targetRelInsertQueries = relationAddQueries.get(relation.target);
                            let queries: IQueryCommand[] = [];
                            if (targetInsertQueries)
                                queries = queries.concat(targetInsertQueries);
                            if (targetRelInsertQueries)
                                queries = queries.concat(targetRelInsertQueries);
                            if (queries) {
                                for (const q of queries.where(o => !!o.parameters)) {
                                    for (const [key] of q.parameters) {
                                        if (key.startsWith(paramKey)) {
                                            const sp = key.lastIndexOf("_");
                                            const colName = key.substr(paramKey.length, sp);
                                            const col = generatedPrimaryCols.any(o => o.columnName === colName);
                                            if (col) {
                                                const index = parseInt(key.substr(sp + 1));
                                                if (!isNaN(index) && datas.length > index) {
                                                    const data = datas[index];
                                                    if (data && data[colName])
                                                        q.parameters.set(key, data[colName]);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    results = results.concat(res);
                }
            }

            for (const query of mergedQueries) {
                const res = await this.executeQuery(query.query, query.parameters);
                results = results.concat(res);
            }
        });

        // reflect all changes to current model

        let i = 0;
        const datas = results.selectMany(o => o.rows);
        const dataIterator = datas[Symbol.iterator]();
        // apply insert changes
        orderedEntityAdd.each(([metaData, addEntries]) => {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of addEntries) {
                // reflect generated value if any
                if (metaData.columns.any(o => !!o.default || (o as NumericColumnMetaData).autoIncrement)) {
                    const row = dataIterator.next().value;
                    if (row) {
                        for (const prop in row) {
                            const col = metaData.columns.first(o => o.columnName === prop);
                            if (col)
                                entry.entity[col.propertyName] = row[prop];
                        }
                    }
                }

                entry.acceptChanges();
                eventEmitter.emitAfterSaveEvent(entry.entity, { type: "insert" });
            }
        });

        // apply relation changes
        orderedRelationAdd.union(orderedRelationDelete).selectMany(o => o[1])
            .where(o => o.masterEntry.state !== EntityState.Detached && o.slaveEntry.state !== EntityState.Detached)
            .each(o => o.acceptChanges());

        // accept update changes.
        // TODO: need visit once stored computed property supported.
        orderedEntityUpdate.each(([metaData, updateEntries]) => {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of updateEntries) {
                entry.acceptChanges();
                eventEmitter.emitAfterSaveEvent(entry.entity, { type: "update" });
            }
        });

        // accept delete changes.
        // TODO: must check delete type: soft delete or hard delete.
        orderedEntityDelete.each(([metaData, deleteEntries]) => {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of deleteEntries) {
                entry.acceptChanges();
                eventEmitter.emitAfterDeleteEvent(entry.entity, { type: "soft" });
            }
        });

        return results.sum(o => o.effectedRows) - i;
    }
    public mergeQueries(queries: IQueryCommand[]): IQueryCommand[] {
        const results: IQueryCommand[] = [];
        const result: IQueryCommand = {
            query: "",
            parameters: new Map()
        };
        for (const query of queries) {
            result.query += (result.query ? "\n\n" : "") + query.query + ";";
            if (query.parameters)
                result.parameters = new Map([...result.parameters, ...query.parameters]);
        }
        results.push(result);
        return results;
    }
    public buildSchema() {
        const queryBuilder = new this.queryBuilder();
        const schemaBuilder = new this.schemaBuilder(this.driver, queryBuilder);

        this.transaction(async () => {
            const schemaQuery = await schemaBuilder.getSchemaQuery(this.entityTypes);
            this.executeCommands(schemaQuery.commit);
        });
    }

    // -------------------------------------------------------------------------
    // DB Event Listener
    // -------------------------------------------------------------------------
    public beforeSave?: <T>(entity: T, param: ISaveEventParam) => boolean;
    public beforeDelete?: <T>(entity: T, param: IDeleteEventParam) => boolean;
    public afterLoad?: <T>(entity: T) => void;
    public afterSave?: <T>(entity: T, param: ISaveEventParam) => void;
    public afterDelete?: <T>(entity: T, param: IDeleteEventParam) => void;

}
