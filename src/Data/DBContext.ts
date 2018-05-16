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
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";

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

        if (entityEntry instanceof EmbeddedEntityEntry) {
            const isModified = (entityEntry.state === EntityState.Detached || entityEntry.state === EntityState.Unchanged) && !(state === EntityState.Detached || state === EntityState.Unchanged);
            const isUnchanged = !(entityEntry.state === EntityState.Detached || entityEntry.state === EntityState.Unchanged) && (state === EntityState.Detached || state === EntityState.Unchanged);
            if (isUnchanged) {
                const embeddedEntries = this.modifiedEmbeddedEntries.get(entityEntry.entity.constructor);
                if (embeddedEntries)
                    embeddedEntries.remove(entityEntry);
            }
            else if (isModified) {
                let typedEntries = this.modifiedEmbeddedEntries.get(entityEntry.dbSet.metaData);
                if (!typedEntries) {
                    typedEntries = [];
                    this.modifiedEmbeddedEntries.set(entityEntry.dbSet.metaData, typedEntries);
                }
                typedEntries.push(entityEntry);
            }
        }
        else {
            switch (entityEntry.state) {
                case EntityState.Added: {
                    const typedAddEntries = this.addEntries.get(entityEntry.entity.constructor);
                    if (typedAddEntries)
                        typedAddEntries.remove(entityEntry);
                }
                    break;
                case EntityState.Deleted: {
                    const typedEntries = this.deleteEntries.get(entityEntry.entity.constructor);
                    if (typedEntries)
                        typedEntries.remove(entityEntry);
                }
                    break;
                case EntityState.Modified: {
                    const typedEntries = this.modifyEntries.get(entityEntry.entity.constructor);
                    if (typedEntries)
                        typedEntries.remove(entityEntry);
                }
                    break;
                case EntityState.Unchanged:
                    break;
            }
            switch (state) {
                case EntityState.Added: {
                    let typedEntries = this.addEntries.get(entityEntry.dbSet.metaData);
                    if (!typedEntries) {
                        typedEntries = [];
                        this.addEntries.set(entityEntry.dbSet.metaData, typedEntries);
                    }
                    typedEntries.push(entityEntry);
                }
                    break;
                case EntityState.Deleted: {
                    let typedEntries = this.deleteEntries.get(entityEntry.dbSet.metaData);
                    if (!typedEntries) {
                        typedEntries = [];
                        this.deleteEntries.set(entityEntry.dbSet.metaData, typedEntries);
                    }
                    typedEntries.push(entityEntry);
                }
                    break;
                case EntityState.Modified: {
                    let typedEntries = this.modifyEntries.get(entityEntry.dbSet.metaData);
                    if (!typedEntries) {
                        typedEntries = [];
                        this.modifyEntries.set(entityEntry.dbSet.metaData, typedEntries);
                    }
                    typedEntries.push(entityEntry);
                }
                    break;
                case EntityState.Unchanged:
                    break;
            }
        }
        entityEntry.state = state;
    }
    public modifiedEmbeddedEntries: Map<IEntityMetaData<any>, Array<EmbeddedEntityEntry>> = new Map();
    public addEntries: Map<IEntityMetaData<any>, Array<EntityEntry>> = new Map();
    public modifyEntries: Map<IEntityMetaData<any>, Array<EntityEntry>> = new Map();
    public deleteEntries: Map<IEntityMetaData<any>, Array<EntityEntry>> = new Map();
    public clear() {
        this.addEntries = new Map();
        this.modifyEntries = new Map();
        this.deleteEntries = new Map();
        for (const [, dbSet] of this.cachedDbSets) {
            dbSet.clear();
        }
    }

    // -------------------------------------------------------------------------
    // DB Event Listener
    // -------------------------------------------------------------------------
    public beforeSave?: <T>(entity: T, param: ISaveEventParam) => boolean;
    public beforeDelete?: <T>(entity: T, param: IDeleteEventParam) => boolean;
    public afterLoad?: <T>(entity: T) => void;
    public afterSave?: <T>(entity: T, param: ISaveEventParam) => void;
    public afterDelete?: <T>(entity: T, param: IDeleteEventParam) => void;

    public async executeQuery(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]> {
        return await this.driver.executeQuery(query, parameters);
    }
    public async executeCommands(queryCommands: IQueryCommand[], parameters?: Map<string, any>): Promise<IQueryResult[]> {
        const mergedCommand = this.mergeQueryCommand(queryCommands);
        if (parameters)
            mergedCommand.parameters = mergedCommand.parameters ? new Map([...mergedCommand.parameters, ...parameters]) : parameters;

        return await this.driver.executeQuery(mergedCommand.query, mergedCommand.parameters);
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

        const insertQueries = [];
        const updateQueries = [];
        const deleteQueries = [];

        // order by priority
        const orderedInsert = new Enumerable(this.addEntries.entries()).orderBy([o => o[0].priority, OrderDirection.ASC]);
        const orderedUpdate = new Enumerable(this.addEntries.entries()).orderBy([o => o[0].priority, OrderDirection.ASC]);
        const orderedDelete = new Enumerable(this.addEntries.entries()).orderBy([o => o[0].priority, OrderDirection.DESC]);

        // apply embedded entity changes
        for (const [, embeddedEntries] of this.modifiedEmbeddedEntries) {
            // TODO: decide whether event emitter required here
            for (const entry of embeddedEntries) {
                if (entry.parentEntry.state === EntityState.Unchanged)
                    entry.parentEntry.changeState(EntityState.Modified);
                continue;
            }
        }

        // trigger before save event.
        for (const [metaData, addEntries] of orderedInsert) {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of addEntries) {
                eventEmitter.emitBeforeSaveEvent(entry.entity, { type: "insert" });
            }
            insertQueries.push(queryBuilder.getInsertQuery(metaData, addEntries));
        }

        for (const [metaData, modifyEntries] of orderedUpdate) {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of modifyEntries) {
                eventEmitter.emitBeforeSaveEvent(entry.entity, { type: "update" });
                updateQueries.push(queryBuilder.getUpdateQuery(metaData, entry));
            }
        }

        for (const [metaData, deleteEntries] of orderedDelete) {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of deleteEntries) {
                eventEmitter.emitBeforeDeleteEvent(entry.entity, { type: "soft" });
            }
            deleteQueries.push(queryBuilder.getDeleteQuery(metaData, deleteEntries));
        }

        queries = queries.concat(insertQueries).concat(updateQueries).concat(deleteQueries);

        // TODO: modified and deleted entities
        const mergedQuery = this.mergeQueryCommand(queries);
        let result: IQueryResult[];

        // execute all in transaction;
        await this.transaction(async () => {
            result = await this.executeQuery(mergedQuery.query, mergedQuery.parameters);
        });

        // set all identity here
        let i = 0;
        let index = 0;
        for (const [metaData, addEntries] of this.addEntries) {
            const eventEmitter = new DBEventEmitter(this, metaData);
            const insertedIdentities = result[i++];
            const hasRow = insertedIdentities && insertedIdentities.rows.length >= 0;
            for (const entry of addEntries) {
                if (hasRow) {
                    const row = insertedIdentities.rows[index];
                    if (row) {
                        for (const prop in row)
                            entry.entity[prop] = row[prop];
                    }
                    entry.acceptChanges();
                }
                eventEmitter.emitAfterSaveEvent(entry.entity, { type: "insert" });
            }
        }
        for (const [metaData, modifyEntries] of this.modifyEntries) {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of modifyEntries) {
                entry.acceptChanges();
                eventEmitter.emitAfterSaveEvent(entry.entity, { type: "update" });
            }
        }
        for (const [metaData, deleteEntries] of this.deleteEntries) {
            const eventEmitter = new DBEventEmitter(this, metaData);
            for (const entry of deleteEntries) {
                entry.acceptChanges();
                eventEmitter.emitAfterDeleteEvent(entry.entity, { type: "soft" });
            }
        }
        this.deleteEntries = new Map();
        return result.sum(o => o.effectedRows);
    }
    public mergeQueryCommand(queries: IQueryCommand[]): IQueryCommand {
        const result: IQueryCommand = {
            query: "",
            parameters: new Map()
        };
        for (const query of queries) {
            result.query += (result.query ? "\n\n" : "") + query.query + ";";
            if (query.parameters)
                result.parameters = new Map([...result.parameters, ...query.parameters]);
        }
        return result;
    }
    public buildSchema() {
        const queryBuilder = new this.queryBuilder();
        const schemaBuilder = new this.schemaBuilder(this.driver, queryBuilder);

        this.transaction(async () => {
            const schemaQuery = await schemaBuilder.getSchemaQuery(this.entityTypes);
            this.executeCommands(schemaQuery.commit);
        });
    }
}
