import type { IQueryCacheManager } from "../Cache/IQueryCacheManager";
import type { IResultCacheManager } from "../Cache/IResultCacheManager";
import { ColumnGeneration, QueryType, UpsertStrategy } from "../Common/Enum";
import type { DbType, DeleteMode, IsolationLevel } from "../Common/StringType";
import type { DbValue, FlatObjectLike, GenericType, IObjectType, RawSchema, SetterObj, StringKeyOf } from "../Common/Type";
import { DefaultConnectionManager } from "../Connection/DefaultConnectionManager";
import type { IConnection } from "../Connection/IConnection";
import type { IConnectionManager } from "../Connection/IConnectionManager";
import type { IDriver } from "../Connection/IDriver";
import { Enumerable } from "@elcy/enumerable";
import type { IEnumerable } from "@elcy/enumerable";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import type { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { OrExpression } from "../ExpressionBuilder/Expression/OrExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { Diagnostic } from "../Logger/Diagnostic";
import type { IDeleteEventParam } from "../MetaData/Interface/IDeleteEventParam";
import type { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import type { ISaveEventParam } from "../MetaData/Interface/ISaveEventParam";
import { DeferredQuery } from "../Query/DeferredQuery";
import type { IQuery } from "../Query/IQuery";
import type { IQueryBuilder } from "../Query/IQueryBuilder";
import type { IQueryOption, ISaveChangesOption } from "../Query/IQueryOption";
import type { IDeferredParameterResolver, IQueryParameterValue, ISqlParameterValueMap } from "../Query/IQueryParameter";
import type { IQueryResult } from "../Query/IQueryResult";
import type { IQueryResultParser } from "../Query/IQueryResultParser";
import type { IQueryVisitor } from "../Query/IQueryVisitor";
import type { ISchemaBuilder } from "../Query/ISchemaBuilder";
import { NamingStrategy } from "../Query/NamingStrategy";
import { QueryTranslator } from "../Query/QueryTranslator";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import type { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import type { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression } from "../Queryable/QueryExpression/UpdateExpression";
import { UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";
import { DbSet } from "./DbSet";
import { EntityEntry } from "./EntityEntry";
import { EntityState } from "./EntityState";
import { DBEventEmitter } from "./Event/DbEventEmitter";
import type { IDBEventListener } from "./Event/IDBEventListener";
import { EmbeddedEntityEntryMap } from "./EmbeddedEntityEntryMap";
import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { EntityChangeMap } from "./EntityChangeMap";
import { RawQueryView } from "./RawQueryView";
import { ComputedColumnMetaData } from "src/MetaData/ComputedColumnMetaData";
import { ColumnExpression } from "src/Queryable/QueryExpression/ColumnExpression";
import { ComputedColumnExpression } from "src/Queryable/QueryExpression/ComputedColumnExpression";
import { isNull, mapKeepExp } from "src/Helper/Util";
import { SqlTableValueParameterExpression } from "src/Queryable/QueryExpression/SqlTableValueParameterExpression";
import { TernaryExpression } from "src/ExpressionBuilder/Expression/TernaryExpression";
import { BitwiseAndExpression } from "src/ExpressionBuilder/Expression/BitwiseAndExpression";
import { AdditionExpression } from "src/ExpressionBuilder/Expression/AdditionExpression";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";
import { getColumnMetadata, getEntityMetadata } from "src/MetaData/MetaDataMapper";
import { RelationMetaData } from "src/MetaData/Relation/RelationMetaData";

const connectionManagerMap = new WeakMap<Function, IConnectionManager<any>>();
const queryCacheManagerMap = new WeakMap<Function, IQueryCacheManager>();
const resultCacheManagerMap = new WeakMap<Function, IResultCacheManager>();

export abstract class DbContext<TDB extends DbType = DbType> implements IDBEventListener<unknown> {
    public get connectionManager() {
        if (!this._connectionManager) {
            this._connectionManager = connectionManagerMap.get(this.constructor);
            if (!this._connectionManager) {
                const conManagerOrDriver = this.factory();
                if ((conManagerOrDriver as IConnectionManager<TDB>).getAllConnections) {
                    this._connectionManager = conManagerOrDriver as IConnectionManager<TDB>;
                }
                else {
                    const driver = conManagerOrDriver as IDriver<TDB>;
                    this._connectionManager = new DefaultConnectionManager(driver);
                }
                connectionManagerMap.set(this.constructor, this._connectionManager);
            }
        }

        return this._connectionManager;
    }
    public get queryBuilder(): IQueryBuilder {
        const queryBuilder = new this.queryBuilderType();
        queryBuilder.namingStrategy = this.namingStrategy;
        return queryBuilder;
    }
    public get queryCacheManager() {
        if (!this._queryCacheManager && this.queryCacheManagerFactory) {
            this._queryCacheManager = queryCacheManagerMap.get(this.constructor) as IQueryCacheManager;
            if (!this._queryCacheManager) {
                this._queryCacheManager = this.queryCacheManagerFactory();
                queryCacheManagerMap.set(this.constructor, this._queryCacheManager);
            }
        }

        return this._queryCacheManager;
    }
    public get queryVisitor(): IQueryVisitor {
        const visitor = new this.queryVisitorType();
        visitor.namingStrategy = this.namingStrategy;
        visitor.translator = this.translator;
        return visitor;
    }
    public get resultCacheManager() {
        if (!this._resultCacheManager && this.resultCacheManagerFactory) {
            this._resultCacheManager = resultCacheManagerMap.get(this.constructor);
            if (!this._resultCacheManager) {
                this._resultCacheManager = this.resultCacheManagerFactory();
                resultCacheManagerMap.set(this.constructor, this._resultCacheManager);
            }
        }

        return this._resultCacheManager;
    }
    constructor(factory?: () => IConnectionManager<TDB> | IDriver<TDB>, types?: IObjectType[]) {
        if (factory) {
            this.factory = factory;
        }
        this.entityTypes = types;
    }
    public afterDelete?: <T>(entity: T, param: IDeleteEventParam) => void;
    public afterLoad?: <T>(entity: T) => void;
    public afterSave?: <T>(entity: T, param: ISaveEventParam) => void;
    public beforeDelete?: <T>(entity: T, param: IDeleteEventParam) => boolean;
    public beforeSave?: <T>(entity: T, param: ISaveEventParam) => boolean;

    //#region DB Event Listener
    public connection?: IConnection;
    public deferredQueries: DeferredQuery[] = [];
    public entityEntries = new EntityChangeMap();
    public readonly entityTypes?: Array<IObjectType>;
    public modifiedEmbeddedEntries: EmbeddedEntityEntryMap = new EmbeddedEntityEntryMap();
    protected readonly factory: () => IConnectionManager<TDB> | IDriver<TDB>;
    protected abstract readonly namingStrategy: NamingStrategy;
    protected abstract readonly queryBuilderType: IObjectType<IQueryBuilder>;
    protected readonly queryCacheManagerFactory?: () => IQueryCacheManager;
    protected abstract readonly queryResultParserType: IObjectType<IQueryResultParser>;
    protected abstract readonly queryVisitorType: IObjectType<IQueryVisitor>;
    protected readonly resultCacheManagerFactory?: () => IResultCacheManager;
    protected abstract readonly schemaBuilderType: IObjectType<ISchemaBuilder>;
    protected abstract readonly translator: QueryTranslator;
    private _cachedDbSets: Map<IObjectType, DbSet> = new Map();
    private _connectionManager: IConnectionManager<TDB>;
    private _queryCacheManager: IQueryCacheManager;
    private _resultCacheManager: IResultCacheManager;

    //#region Entry
    public entry<T extends object>(entity: T) {
        const set = this.set<T>(entity.constructor as IObjectType<T>);
        if (!set) {
            throw new Error(`Unknown type ${entity.constructor.name}`);
        }

        return set.entry(entity);
    }
    public attach<T extends object>(entity: T, all?: boolean): EntityEntry<T>;
    public attach<T extends object>(entities: T[], all?: boolean): EntityEntry<T>[];
    public attach<T extends object>(entities: T | T[], all = false) {
        let isSingle = false;
        if (!Array.isArray(entities)) {
            isSingle = true;
            entities = [entities];
        }
        const entries: EntityEntry<T>[] = [];
        for (const entity of entities) {
            const entry = this.entry(entity);
            entries.push(entry);
            if (entry.state !== EntityState.Detached) {
                continue;
            }

            entry.state = EntityState.Unchanged;
            if (all) {
                for (const relation of entry.metaData.relations) {
                    if (relation.relationType === "one") {
                        const relEntity = entity[relation.propertyName];
                        if (relEntity) {
                            this.attach(relEntity as object, true);
                        }
                    }
                    else {
                        const relEntities = entity[relation.propertyName];
                        if (Array.isArray(relEntities)) {
                            for (const itemEntity of relEntities) {
                                this.attach(itemEntity, true);
                            }
                        }
                    }
                }
                for (const relation of entry.metaData.embeds) {
                    const relEntity = entity[relation.propertyName];
                    if (relEntity && typeof relEntity == "object") {
                        const relEntry = this.attach(relEntity, true);
                        if (relEntry) {
                            entity[relation.propertyName] = relEntry.entity;
                        }
                    }
                }
            }
        }

        return isSingle ? entries[0] : entries;
    }
    public detach<T extends object>(entity: T): EntityEntry<T>;
    public detach<T extends object>(entities: T[]): EntityEntry<T>[];
    public detach<T extends object>(entities: T | T[]) {
        let isSingle = false;
        if (!Array.isArray(entities)) {
            isSingle = true;
            entities = [entities];
        }
        const entries: EntityEntry<T>[] = [];
        for (const entity of entities) {
            const entry = this.entry(entity);
            entries.push(entry);
            if (entry.state !== EntityState.Detached) {
                entry.state = EntityState.Detached;
            }
        }
        return isSingle ? entries[0] : entries;
    }
    public add<T extends object>(entity: T): EntityEntry<T>;
    public add<T extends object>(entities: T[]): EntityEntry<T>[];
    public add<T extends object>(entities: T | T[]): EntityEntry<T> | EntityEntry<T>[] {
        let isSingle = false;
        if (!Array.isArray(entities)) {
            isSingle = true;
            entities = [entities];
        }
        const entries: EntityEntry<T>[] = [];
        for (const entity of entities) {
            const entry = this.attach(entity);
            entries.push(entry);
            if (entry) {
                entry.add();
            }
        }
        return isSingle ? entries[0] : entries;
    }
    public update<T extends object>(entity: T, originalValues?: FlatObjectLike<T>) {
        const entry = this.attach(entity);
        if (entry) {
            if (originalValues instanceof Object) {
                entry.setOriginalValues(originalValues);
            }
            entry.state = EntityState.Modified;
        }
        return entry;
    }
    public delete<T extends object>(entity: T): EntityEntry<T>;
    public delete<T extends object>(entities: T[]): EntityEntry<T>[];
    public delete<T extends object>(entities: T | T[]) {
        let isSingle = false;
        if (!Array.isArray(entities)) {
            isSingle = true;
            entities = [entities];
        }
        const entries: EntityEntry<T>[] = [];
        for (const entity of entities) {
            const entry = this.attach(entity);
            entries.push(entry);
            if (entry) {
                entry.delete();
            }
        }
        return isSingle ? entries[0] : entries;
    }
    //#endregion
    public clear() {
        this.modifiedEmbeddedEntries.clear();
        this.entityEntries.reset();
        for (const [, dbSet] of this._cachedDbSets) {
            dbSet.clear();
        }
    }
    public async closeConnection(con?: IConnection) {
        if (!con) {
            con = this.connection;
        }
        if (con && !con.inTransaction) {
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `Close connection.`);
            }
            this.connection = null;
            await con.close();
        }
    }

    public map<TSchema extends RawSchema>(schema: TSchema): RawQueryView<TSchema> {
        return new RawQueryView(schema, this);
    }

    // -------------------------------------------------------------------------
    // Query Function
    // -------------------------------------------------------------------------
    public async executeDeferred(deferredQueries?: IEnumerable<DeferredQuery>) {
        if (!deferredQueries) {
            deferredQueries = this.deferredQueries.splice(0);
        }

        const queryBuilder = this.queryBuilder;

        // check cached
        if (this.resultCacheManager) {
            const deferredArray = ArrayExtension.asArray(deferredQueries);
            const cacheQueries = deferredArray.filter((o) => o.command instanceof SelectExpression && o.queryOption.resultCache !== "none");
            const cachedResults = await this.resultCacheManager.gets(...cacheQueries.map((o) => o.hashCode().toString()));
            let index = 0;
            for (const cacheQuery of cacheQueries) {
                const res = cachedResults[index++];
                if (res) {
                    cacheQuery.buildQuery(queryBuilder);
                    cacheQuery.resolve(res);
                    ArrayExtension.delete(deferredArray, cacheQuery);
                }
            }
            deferredQueries = deferredArray;
        }

        // analyze parameters
        // db has parameter size limit and query size limit.
        const paramPrefix = queryBuilder.namingStrategy.getAlias("param");
        let i = 0;
        for (const [key, p] of deferredQueries.flatMap((o) => Array.from(o.parameters.entries()))) {
            p.name = paramPrefix + i++;
            p.value = key instanceof SqlTableValueParameterExpression ? p.value : queryBuilder.persistValue(p.value, key.column);
        }

        const queries = deferredQueries.flatMap((o) => o.buildQuery(queryBuilder));
        const mergedQueries = queryBuilder.mergeQueries(queries);
        if (!mergedQueries.length) {
            return;
        }

        const queryResult: IQueryResult[] = await this.executeQueries(...mergedQueries);

        for (const deferredQuery of deferredQueries) {
            const results = queryResult.splice(0, deferredQuery.queries.length);
            deferredQuery.resolve(results);

            // cache result
            if (this.resultCacheManager) {
                if (deferredQuery.command instanceof SelectExpression) {
                    const queryOption = deferredQuery.queryOption;
                    if (queryOption.resultCache !== "none") {
                        if (queryOption.resultCache && !queryOption.resultCache.disableEntityAsTag) {
                            queryOption.resultCache.tags = Enumerable.from(queryOption.resultCache.tags).union(Enumerable.from(deferredQuery.command.getEffectedEntities()).map((o) => `entity:${o.name}`)).distinct().toArray();
                        }
                        // fire and forget
                        void this.resultCacheManager.set(deferredQuery.hashCode().toString(), results, queryOption.resultCache);
                    }
                }
                else {
                    const effecteds = deferredQuery.command.getEffectedEntities().map((o) => `entity:${o.name}`);
                    // fire and forget
                    void this.resultCacheManager.removeTag(...effecteds);
                }
            }
        }
    }
    //#endregion

    public async executeQueries(...queries: IQuery[]): Promise<IQueryResult[]> {
        let results: IQueryResult[] = [];
        if (queries.length) {
            const con = await this.getConnection(queries.some((o) => !!(o.type & QueryType.DQL)));
            if (!con.isOpen) {
                await con.open();
            }
            const timer = Diagnostic.timer(false);
            for (const query of queries) {
                if (timer) { timer.start() };
                if (Diagnostic.enabled) {
                    Diagnostic.debug(con, `Execute Query.`, query);
                }
                const res = await con.query(query);
                if (Diagnostic.enabled) {
                    Diagnostic.debug(con, `Query Result.`, res);
                    Diagnostic.trace(con, `Execute Query time: ${timer.time()}ms`);
                }
                results = results.concat(res);
            }
            await this.closeConnection(con);
        }
        return results;
    }
    public async getConnection(writable?: boolean) {
        const con = this.connection ? this.connection : await this.connectionManager.getConnection(writable);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `Get connection. used existing connection: ${!!this.connection}`);
        }
        return con;
    }
    public getQueryResultParser<T = unknown>(command: IQueryExpression, queryBuilder: IQueryBuilder): IQueryResultParser<T> {
        const queryParser = new this.queryResultParserType() as IQueryResultParser<T>;
        queryParser.queryBuilder = queryBuilder;
        queryParser.queryExpression = command;
        return queryParser;
    }
    public async getUpdateSchemaQueries(entityTypes: IObjectType[]) {
        const con = await this.getConnection();
        if (!con.isOpen) {
            await con.open();
        }
        const schemaBuilder = new this.schemaBuilderType();
        schemaBuilder.connection = con;
        schemaBuilder.queryBuilder = this.queryBuilder;
        return await schemaBuilder.getSchemaQuery(entityTypes);
    }

    //#endregion

    private getRowKey(entityMeta: IEntityMetaData, data: object): string {
        return entityMeta.primaryKeys.map(o => String(data[o.columnName as keyof object])).join("|");
    }
    //#region Update
    public async saveChanges(options?: ISaveChangesOption): Promise<number> {
        if (!this.entityEntries.hasChanges()) {
            return 0;
        }

        const insertQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult<object>>>> = new Map();
        const updateQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult<object>>>> = new Map();
        const deleteQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult>>> = new Map();

        // order by priority
        const orderedEntityAdd = Enumerable.from(this.entityEntries.add).filter(o => Boolean(o[1]?.length)).orderBy([(o) => o[0].priority, "ASC"]).toMap((o) => o[0], (o) => o[1]);
        const orderedEntityUpdate = Enumerable.from(this.entityEntries.update).filter(o => Boolean(o[1]?.length)).orderBy([(o) => o[0].priority, "ASC"]).toMap((o) => o[0], (o) => o[1]);
        const orderedEntityDelete = Enumerable.from(this.entityEntries.delete).filter(o => Boolean(o[1]?.length)).orderBy([(o) => o[0].priority, "DESC"]).toMap((o) => o[0], (o) => o[1]);

        const visitor = this.queryVisitor;
        visitor.queryOption = options;

        // apply embedded entity changes
        for (const [, embeddedEntries] of this.modifiedEmbeddedEntries) {
            // TODO: decide whether event emitter required here
            for (const entry of embeddedEntries) {
                if (entry.parentEntry.state === EntityState.Unchanged) {
                    entry.parentEntry.state = EntityState.Modified;
                }
                continue;
            }
        }

        const eventHandlerMap = new Map<IEntityMetaData, DBEventEmitter>();
        const getEventEmitter = (entityMeta: IEntityMetaData, ...eventHandlers: Array<IDBEventListener>) => {
            let emitter = eventHandlerMap.get(entityMeta);
            if (!emitter) {
                emitter = new DBEventEmitter(entityMeta, ...eventHandlers);
                eventHandlerMap.set(entityMeta, emitter);
            }
            return emitter;
        };

        const autoEntriesMap = new Map<IEntityMetaData, EntityEntry[]>();
        // Before add event and generate query
        for (const [entityMeta, addEntries] of orderedEntityAdd) {
            const eventEmitter = getEventEmitter(entityMeta, this);
            eventEmitter.emitBeforeSaveEvent({ type: "insert" }, ...addEntries);
            let useUpsert = Boolean(options?.upsertStrategy & UpsertStrategy.Insert);
            if (useUpsert) {
                useUpsert = !entityMeta.hasIncrementPrimary;
            }
            const insertResult = useUpsert ? this.getUpsertQueries(entityMeta, addEntries, visitor, options) : this.getInsertQueries(entityMeta, addEntries, visitor, options);
            if (entityMeta.hasIncrementPrimary) {
                autoEntriesMap.set(entityMeta, addEntries);
            }
            insertQueries.set(entityMeta, insertResult);
        }

        // Before update event and generate query
        for (const [entityMeta, updateEntries] of orderedEntityUpdate) {
            const eventEmitter = getEventEmitter(entityMeta, this);
            eventEmitter.emitBeforeSaveEvent({ type: "update" }, ...updateEntries);
            let useUpsert = Boolean(options?.upsertStrategy & UpsertStrategy.Update);
            if (useUpsert) {
                useUpsert = (entityMeta.concurrencyMode ?? "NONE") === "NONE";
            }
            updateQueries.set(entityMeta, useUpsert ? this.getUpsertQueries(entityMeta, updateEntries, visitor, options) : this.getUpdateQueries(entityMeta, updateEntries, visitor, options));
        }

        // Before delete even and generate query
        let deleteMode: DeleteMode;
        if (options && options.forceHardDelete) {
            deleteMode = "hard";
        }

        for (const [entityMeta, deleteEntries] of orderedEntityDelete) {
            const eventEmitter = getEventEmitter(entityMeta, this);
            const deleteParam: IDeleteEventParam = {
                type: deleteMode ? deleteMode : entityMeta.deletedColumn ? "soft" : "hard"
            };
            eventEmitter.emitBeforeDeleteEvent(deleteParam, ...deleteEntries);
            deleteQueries.set(entityMeta, this.getDeleteQueries(entityMeta, deleteEntries, visitor, deleteMode, options));
        }

        const entityAutoIdentityMap = new Map<IEntityMetaData, Map<EntityEntry, string>>();
        const identityParameterMap = Enumerable.from(insertQueries).concat(updateQueries)
            .flatMap(o => o[1])
            .flatMap(o => o.parameters)
            .flatMap(o => o[1].resolvers)
            .groupBy(o => o.entityMeta)
            .toMap(o => o.key, o => o.toArray());
        const entityIdRowDataMap = new Map<IEntityMetaData, Map<number, Record<string, unknown>>>();
        // execute all in transaction;
        await this.transaction(async () => {
            // execute delete
            if (deleteQueries.size) {
                await this.executeDeferred(Enumerable.from(deleteQueries).flatMap((o) => o[1]));
            }

            // execute all insert queries
            let insertBatches: DeferredQuery[] = [];
            const entityAutoIndexMap = new Map<IEntityMetaData, number>();
            for (const [entityMeta, queries] of insertQueries) {
                insertBatches.push(...queries);
                if (!entityMeta.hasIncrementPrimary) {
                    continue;
                }

                await this.executeDeferred(insertBatches);
                insertBatches = [];
                const rowValues = Enumerable.from(queries).flatMap((o) => o.value.rows as IEnumerable<Record<string, unknown>>);
                let idRowDataMap = entityIdRowDataMap.get(entityMeta);
                if (!(idRowDataMap instanceof Map)) {
                    idRowDataMap = new Map();
                    entityIdRowDataMap.set(entityMeta, idRowDataMap);
                }

                let identityRows = entityAutoIdentityMap.get(entityMeta);
                if (isNull(identityRows)) {
                    identityRows = new Map();
                    entityAutoIdentityMap.set(entityMeta, identityRows);
                }

                const autoEntries = autoEntriesMap.get(entityMeta);
                const autoAddedEntries = this.entityEntries.add.get(entityMeta);
                for (const rowValue of rowValues) {
                    let i = entityAutoIndexMap.get(entityMeta) ?? 0;
                    const entry = autoEntries[i];
                    identityRows.set(entry, this.getRowKey(entityMeta, rowValue));
                    idRowDataMap.set(autoAddedEntries.indexOf(entry), rowValue);
                    entityAutoIndexMap.set(entityMeta, ++i);
                }

                const params = identityParameterMap.get(entityMeta);
                if (Array.isArray(params)) {
                    const foundGeneratedParams = [];
                    for (const p of params) {
                        if (!idRowDataMap.has(p.entryIndex)) {
                            continue;
                        }

                        foundGeneratedParams.push(p);
                        const rowData = idRowDataMap.get(p.entryIndex);
                        p.resolve(rowData);
                    }
                    ArrayExtension.delete(params, ...foundGeneratedParams);
                }
            }
            if (insertBatches.length) {
                await this.executeDeferred(insertBatches);
            }

            if (updateQueries.size) {
                await this.executeDeferred(Enumerable.from(updateQueries).flatMap((o) => o[1]));
            }

            // emit delete changes.
            for (const [entityMeta] of deleteQueries) {
                const eventEmitter = getEventEmitter(entityMeta, this);
                const entityEntries = orderedEntityDelete.get(entityMeta);
                const deleteParam: IDeleteEventParam = {
                    type: deleteMode ? deleteMode : entityMeta.deletedColumn ? "soft" : "hard"
                };
                for (const entry of entityEntries) {
                    eventEmitter.emitAfterDeleteEvent(deleteParam, entry);
                }
            }

            // update all generated value from database. ex: identity, default, etc...
            for (const [entityMeta, queries] of insertQueries) {
                const eventEmitter = getEventEmitter(entityMeta, this);
                const parentRelations = Enumerable.from(entityMeta.relations)
                    .filter((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);

                const updateData = Enumerable.from(queries).flatMap((o) => o.value.rows).toMap((o) => this.getRowKey(entityMeta, o));
                const entityEntries = orderedEntityAdd.get(entityMeta);
                const identityKeys = entityAutoIdentityMap.get(entityMeta);
                for (let i = 0, len = entityEntries.length; i < len; i++) {
                    const entityEntry = entityEntries[i];
                    let key = entityEntry.key;
                    if (entityMeta.hasIncrementPrimary) {
                        key = identityKeys.get(entityEntry);
                    }
                    const data = updateData.get(key) as Record<string, DbValue>;
                    if (data) {
                        for (const prop in data) {
                            const column = entityMeta.columns.find((o) => o.columnName === prop);
                            if (column) {
                                entityEntry.entity[column.propertyName] = this.queryBuilder.hydrateValue(data[prop], column);
                            }
                        }
                    }

                    for (const rel of parentRelations) {
                        const parentEntity = entityEntry.entity[rel.propertyName] as Record<string, unknown>;
                        if (!parentEntity) {
                            continue;
                        }

                        for (const [col, parentCol] of rel.relationMaps) {
                            entityEntry.entity[col.propertyName] = parentEntity[parentCol.propertyName];
                        }
                    }

                    // TODO: set relation property here.
                    eventEmitter.emitAfterSaveEvent({ type: "insert" }, entityEntry);
                }
            }

            // accept update changes.
            for (const [entityMeta, queries] of updateQueries) {
                const eventEmitter = getEventEmitter(entityMeta, this);

                const parentRelations = Enumerable.from(entityMeta.relations)
                    .filter((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);

                const dbSet = this.set(entityMeta.type);
                const updateData = Enumerable.from(queries).flatMap((o) => o.value.rows).toMap((o: object) => dbSet.getKey(o), (o: object) => o);
                const entityEntries = orderedEntityUpdate.get(entityMeta);
                for (const entityEntry of entityEntries) {
                    const data = updateData.get(entityEntry.key) as Record<string, DbValue>;
                    if (data) {
                        for (const prop in data) {
                            const column = entityMeta.columns.find((o) => o.columnName === prop);
                            if (column) {
                                entityEntry.entity[column.propertyName] = this.queryBuilder.hydrateValue(data[prop], column);
                            }
                        }
                    }

                    for (const rel of parentRelations) {
                        const parentEntity = entityEntry.entity[rel.propertyName] as Record<string, unknown>;
                        if (!parentEntity) {
                            continue;
                        }
                        const modifiedProperties = entityEntry.getModifiedProperties();
                        if (!rel.relationColumns.some(o => modifiedProperties.includes(o.propertyName))) {
                            continue;
                        }

                        for (const [col, parentCol] of rel.relationMaps) {
                            entityEntry.entity[col.propertyName] = parentEntity[parentCol.propertyName];
                        }
                    }

                    eventEmitter.emitAfterSaveEvent({ type: "update" }, entityEntry);
                }
            }

            if (options?.acceptAllChangesOnSuccess !== false) {
                this.acceptAllChanges();
            }
        });

        const effectedRow = Enumerable.from<DeferredQuery<IQueryResult>[]>(insertQueries.values())
            .concat(updateQueries.values())
            .concat(deleteQueries.values())
            .flatMap(o => o)
            .sum(o => o.value.effectedRows);

        return effectedRow;
    }
    protected acceptAllChanges() {
        const deletedEntities = Enumerable.from(this.entityEntries.delete)
            .orderBy([(o) => o[0].priority, "ASC"])
            .flatMap(o => o[1]);
        for (const entry of deletedEntities) {
            entry.acceptChanges();
        }

        const addedEntities = Enumerable.from(this.entityEntries.add)
            .orderBy([(o) => o[0].priority, "ASC"])
            .flatMap(o => o[1]);
        for (const entry of addedEntities) {
            entry.acceptChanges();
        }

        const updatedEntities = Enumerable.from(this.entityEntries.update)
            .orderBy([(o) => o[0].priority, "ASC"])
            .flatMap(o => o[1]);
        for (const entry of updatedEntities) {
            entry.acceptChanges();
        }
    }

    //#region Entity Tracker
    public set<T extends object = object>(type: IObjectType<T>, isClearCache = false): DbSet<T> {
        let result: DbSet<T>;
        if (!isClearCache) {
            result = this._cachedDbSets.get(type);
        }
        if (!result && this.entityTypes?.includes(type) !== false && getEntityMetadata(type)) {
            result = new DbSet(type, this);
            this._cachedDbSets.set(type, result);
        }
        return result;
    }
    public async syncSchema() {
        const schemaQuery = await this.getUpdateSchemaQueries(this.entityTypes ?? []);
        const commands = this.queryBuilder.mergeQueries(schemaQuery.commit);

        // must be executed to all connection in case connection manager handle replication
        const serverConnections = await this.connectionManager.getAllConnections();
        for (const serverConnection of serverConnections) {
            this.connection = serverConnection;
            await this.transaction(async () => {
                await this.executeQueries(...commands);
            });
        }
    }
    public async transaction(transactionBody: () => Promise<void>): Promise<void>;
    public async transaction(isolationLevel: IsolationLevel, transactionBody: () => Promise<void>): Promise<void>;
    public async transaction(isolationOrBody: IsolationLevel | (() => Promise<void>), transactionBody?: () => Promise<void>): Promise<void> {
        let isSavePoint;
        try {
            let isolationLevel: IsolationLevel;
            if (typeof isolationOrBody === "function") {
                transactionBody = isolationOrBody;
            }
            else {
                isolationLevel = isolationOrBody;
            }

            this.connection = await this.getConnection(true);
            if (!this.connection.isOpen) {
                await this.connection.open();
            }

            isSavePoint = this.connection.inTransaction;
            await this.connection.startTransaction(isolationLevel);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this.connection, isSavePoint ? "Set transaction save point" : "Start transaction");
            }
            await transactionBody();
            await this.connection.commitTransaction();
            if (Diagnostic.enabled) {
                Diagnostic.debug(this.connection, isSavePoint ? "commit transaction save point" : "Commit transaction");
            }
            if (!isSavePoint) {
                await this.closeConnection();
            }
        }
        catch (e) {
            if (Diagnostic.enabled) {
                Diagnostic.error(this.connection, e instanceof Error ? e.message : "Error", e);
            }
            await this.connection.rollbackTransaction();
            if (Diagnostic.enabled) {
                Diagnostic.debug(this.connection, isSavePoint ? "rollback transaction save point" : "rollback transaction");
            }
            if (isSavePoint === false) {
                await this.closeConnection();
            }
            throw e;
        }
    }

    protected getDeleteQueries<TE extends object>(entityMeta: IEntityMetaData<TE>, entries: IEnumerable<EntityEntry<TE>>, visitor?: IQueryVisitor, deleteMode?: DeleteMode, option?: IQueryOption): Array<DeferredQuery<IQueryResult>> {
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (!entries.some(() => true)) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }

        const entityExp = new EntityExpression(entityMeta.type, visitor.newAlias());
        if (!deleteMode) {
            deleteMode = entityExp.deleteColumn ? "soft" : "hard";
        }

        const tvpExp = new SqlTableValueParameterExpression(new ParameterExpression<TE[]>("delete", Array), {} as any);
        const relation = new AndExpression();
        for (const column of entityExp.primaryColumns) {
            const newValueColumn = new ColumnExpression(tvpExp, column.type, column.propertyName, column.columnName, true, true, column.columnMeta.columnType);
            tvpExp.columns.push(newValueColumn);
            relation.operands.push(new StrictEqualExpression(column, newValueColumn));
        }

        const paramValue: IQueryParameterValue<Partial<TE>[]> = {
            value: [],
            resolvers: []
        };
        for (const entry of entries) {
            const row: Partial<TE> = {};
            const entity = entry.entity;

            for (const col of tvpExp.columns) {
                row[col.propertyName] = entity[col.propertyName];
            }
            paramValue.value.push(row);
        }

        if (deleteMode === "hard") {
            const deleteExp = new DeleteExpression(entityExp);
            deleteExp.paramExps.push(tvpExp);

            const valueSelectExp = new SelectExpression(tvpExp);
            valueSelectExp.selects = tvpExp.columns.filter((o) => !o.isPrimary);
            valueSelectExp.isSubSelect = true;
            deleteExp.addJoin(valueSelectExp, relation.asOperand(), "INNER");

            const queryParameterMap: ISqlParameterValueMap = new Map([[tvpExp, paramValue]]);
            const deleteQuery = new DeferredQuery(this, deleteExp, queryParameterMap, (resultMap) => {
                let effectedRows = 0;
                for (const [command, result] of resultMap) {
                    if (command.type & QueryType.ADDITIONAL) {
                        continue;
                    }
                    if (command.type & QueryType.DML) {
                        effectedRows += result.effectedRows;
                    }
                }

                return {
                    effectedRows: effectedRows
                } as IQueryResult;
            }, option);
            results.push(deleteQuery);
        }
        else {
            if (!entityExp.deleteColumn) {
                throw "no delete column";
            }

            const setter: SetterObj<TE> = {};
            setter[entityExp.deleteColumn.propertyName] = new ValueExpression(true as TE[StringKeyOf<TE>]);
            if (entityMeta.modifiedDateColumn) {
                setter[entityMeta.modifiedDateColumn.propertyName] = entityMeta.modifiedDateColumn.defaultExp.body as IExpression<TE[keyof TE]>;
            }
            if (entityMeta.versionColumn && entityMeta.versionColumn.columnType === "int") {
                setter[entityMeta.versionColumn.propertyName] = new AdditionExpression(entityExp.versionColumn as IColumnExpression<TE, number>, new ValueExpression(1)) as unknown as IExpression<TE[keyof TE]>;
            }

            const updateExp = new UpdateExpression(entityExp, setter);
            updateExp.addWhere(new StrictEqualExpression(entityExp.deleteColumn, new ValueExpression(false)));
            updateExp.paramExps.push(tvpExp);

            const valueSelectExp = new SelectExpression(tvpExp);
            valueSelectExp.selects = tvpExp.columns.filter((o) => !o.isPrimary);
            valueSelectExp.isSubSelect = true;
            updateExp.addJoin(valueSelectExp, relation.asOperand(), "INNER");

            const queryParameterMap: ISqlParameterValueMap = new Map([[tvpExp, paramValue]]);
            const softDeleteQuery = new DeferredQuery(this, updateExp, queryParameterMap, (resultMap) => {
                let effectedRows = 0;
                for (const [command, result] of resultMap) {
                    if (command.type & QueryType.ADDITIONAL) {
                        continue;
                    }
                    if (command.type & QueryType.DML) {
                        effectedRows += result.effectedRows;
                    }
                }

                return {
                    effectedRows: effectedRows
                } as IQueryResult;
            }, option);
            results.push(softDeleteQuery);

            if (option?.softDeleteCascade) {
                this.softDeleteCascade(updateExp, visitor);
            }
        }

        return results;
    }
    public softDeleteCascade<TE extends object>(updateExp: UpdateExpression<TE>, visitor: IQueryVisitor) {
        // apply delete option rule. coz soft delete delete option will not handled by db.
        const updateExps: UpdateExpression<any>[] = [updateExp, ...updateExp.includes.map(o => o.child)];
        const processedMetaSet = new Set(updateExps.map(o => o.entity.metaData));
        for (let i = 0; i < updateExps.length; i++) {
            const parentExp = updateExps[i];
            const relations = parentExp.entity.metaData.relations?.filter((o) => o.isMaster);
            if (relations?.some(() => true) != true) {
                continue;
            }

            for (const relation of relations) {
                if (relation.completeRelationType === "many-many") {
                    continue;
                }

                const target = relation.target;
                if (processedMetaSet.has(target)) {
                    continue;
                }

                const deleteOption = relation.reverseRelation.deleteOption;
                switch (deleteOption) {
                    case "CASCADE": {
                        if (!target.deletedColumn) {
                            continue;
                        }

                        const childEntityExp = new EntityExpression(target.type, visitor.newAlias());
                        const setter: SetterObj<any> = {};
                        setter[target.deletedColumn.propertyName] = new ValueExpression(true);
                        if (target.modifiedDateColumn) {
                            setter[target.modifiedDateColumn.propertyName] = target.modifiedDateColumn.defaultExp.body as IExpression<TE[keyof TE]>;
                        }
                        if (target.versionColumn && target.versionColumn.columnType === "int") {
                            setter[target.versionColumn.propertyName] = new AdditionExpression(childEntityExp.versionColumn as IColumnExpression<TE, number>, new ValueExpression(1));
                        }
                        const childUpdateExp = new UpdateExpression(childEntityExp, setter);
                        childUpdateExp.addWhere(new StrictEqualExpression(childEntityExp.deleteColumn, new ValueExpression(false)));

                        if (parentExp.parentRelation) {
                            const cloneMap = new Map<IExpression, IExpression>();
                            mapKeepExp(cloneMap, parentExp.entity);
                            childUpdateExp.addJoin(parentExp.select.clone(cloneMap), relation, "INNER");
                            updateExp.addInclude(childUpdateExp, parentExp.parentRelation.relation);
                        }
                        else {
                            updateExp.addInclude(childUpdateExp, relation as RelationMetaData<TE>);
                        }

                        processedMetaSet.add(target);
                        updateExps.push(childUpdateExp);
                        break;
                    }
                    case "SET NULL": {
                        const childEntityExp = new EntityExpression(target.type, visitor.newAlias());
                        const setter: { [key: string]: IExpression<any> } = {};
                        for (const col of relation.reverseRelation.relationColumns) {
                            setter[col.propertyName] = new ValueExpression(null);
                        }
                        if (target.modifiedDateColumn) {
                            setter[target.modifiedDateColumn.propertyName] = target.modifiedDateColumn.defaultExp.body as IExpression<TE[keyof TE]>;
                        }
                        if (target.versionColumn && target.versionColumn.columnType === "int") {
                            setter[target.versionColumn.propertyName] = new AdditionExpression(childEntityExp.versionColumn as IColumnExpression<TE, number>, new ValueExpression(1));
                        }
                        const childUpdateExp = new UpdateExpression(childEntityExp, setter);
                        if (parentExp.parentRelation) {
                            const cloneMap = new Map<IExpression, IExpression>();
                            mapKeepExp(cloneMap, parentExp.entity);
                            childUpdateExp.addJoin(parentExp.select.clone(cloneMap), relation, "INNER");
                            updateExp.addInclude(childUpdateExp, parentExp.parentRelation.relation);
                        }
                        else {
                            updateExp.addInclude(childUpdateExp, relation as RelationMetaData<TE>);
                        }
                        break;
                    }
                    case "SET DEFAULT": {
                        const childEntityExp = new EntityExpression(target.type, visitor.newAlias());
                        const setter: { [key: string]: IExpression<any> } = {};
                        for (const col of relation.reverseRelation.relationColumns) {
                            setter[col.propertyName] = col.defaultExp?.body ?? new ValueExpression(null);
                        }
                        if (target.modifiedDateColumn) {
                            setter[target.modifiedDateColumn.propertyName] = target.modifiedDateColumn.defaultExp.body as IExpression<TE[keyof TE]>;
                        }
                        if (target.versionColumn && target.versionColumn.columnType === "int") {
                            setter[target.versionColumn.propertyName] = new AdditionExpression(childEntityExp.versionColumn as IColumnExpression<TE, number>, new ValueExpression(1));
                        }
                        const childUpdateExp = new UpdateExpression(childEntityExp, setter);
                        if (parentExp.parentRelation) {
                            const cloneMap = new Map<IExpression, IExpression>();
                            mapKeepExp(cloneMap, parentExp.entity);
                            childUpdateExp.addJoin(parentExp.select.clone(cloneMap), relation, "INNER");
                            updateExp.addInclude(childUpdateExp, parentExp.parentRelation.relation);
                        }
                        else {
                            updateExp.addInclude(childUpdateExp, relation as RelationMetaData<TE>);
                        }
                        break;
                    }
                }
            }
        }
    }
    protected getInsertQueries<TE extends object>(entityMeta: IEntityMetaData<TE>, entries: IEnumerable<EntityEntry<TE>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult<FlatObjectLike<TE>>>> {
        const results: Array<DeferredQuery<IQueryResult<FlatObjectLike<TE>>>> = [];
        const entryCount = Enumerable.from(entries).count();
        if (entryCount <= 0) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const entityExp = new EntityExpression<TE>(entityMeta.type, visitor.newAlias("entity"));
        const relations = Enumerable.from(entityMeta.relations)
            .filter((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        const columns = Enumerable.from(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns)
            .toArray();

        let generatedColumns = Enumerable.from(entityMeta.insertGeneratedColumns)
            .union(Enumerable.from(entityMeta.columns).filter((o) => !!o.defaultExp));
        let returnings: IColumnExpression[] = [];
        if (generatedColumns.some()) {
            returnings = Enumerable.from(entityMeta.primaryKeys).union(generatedColumns).map(o => {
                if (o instanceof ComputedColumnMetaData) {
                    const result = visitor.visitFunction(o.functionExpression.clone(), [entityExp], { selectExpression: new SelectExpression(entityExp) });
                    return new ComputedColumnExpression(entityExp, result, o.propertyName);
                }
                return new ColumnExpression(entityExp, o);
            }).toArray();
        }

        // for self reference auto increment pk, need to split those.
        // TODO: maybe should check for insert generated pk too?
        if (entityMeta.hasIncrementPrimary) {
            // if primary key is auto increment, then need to split all query per entry.
            // and there should only 1 incremental column in a table.

            for (const entry of entries) {
                const insertExp = new InsertExpression<TE>(entityExp, []);
                insertExp.returnings = returnings;
                const queryParameters: ISqlParameterValueMap = new Map();
                const itemExp: SetterObj<TE> = {};

                for (const rel of relations) {
                    const parentEntity = entry.entity[rel.propertyName] as Record<string, unknown>;
                    if (parentEntity) {
                        const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                        const isGeneratedPrimary = parentEntry.state === EntityState.Added && typeof parentEntry.key !== "string";
                        const index = isGeneratedPrimary ? parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.metaData)?.indexOf(parentEntry) : undefined;
                        for (const [col, parentCol] of rel.relationMaps) {
                            const paramExp = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), parentCol.type), col);
                            const parameterValue: IQueryParameterValue = {};
                            if (isGeneratedPrimary) {
                                const resolvers: IDeferredParameterResolver[] = [
                                    {
                                        entityMeta: parentEntry.metaData,
                                        entryIndex: index,
                                        resolve(row: Record<string, unknown>) {
                                            parameterValue.value = row[parentCol.columnName];
                                        }
                                    }
                                ];
                                parameterValue.resolvers = resolvers;
                            }
                            else {
                                parameterValue.value = parentEntity[parentCol.propertyName];
                            }
                            queryParameters.set(paramExp, parameterValue);
                            insertExp.paramExps.push(paramExp);
                            itemExp[col.propertyName] = paramExp as SqlParameterExpression<TE[keyof TE]>;
                        }
                    }
                }

                for (const col of columns) {
                    if (itemExp[col.propertyName]) {
                        continue;
                    }

                    const value = entry.entity[col.propertyName];
                    if (value !== undefined) {
                        const param = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), col.type as GenericType<TE[keyof TE]>), col as IColumnMetaData<any, TE[keyof TE]>);
                        queryParameters.set(param, { value: value });
                        itemExp[col.propertyName] = param;
                        insertExp.paramExps.push(param);
                    }
                }

                insertExp.values.push(itemExp);
                const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (resultMap) => {
                    let rows = Enumerable.from<unknown>([]);
                    let effectedRows = 0;
                    for (const [command, result] of resultMap) {
                        if (command.type & QueryType.ADDITIONAL) {
                            continue;
                        }
                        if ((command.type & QueryType.DQL) && result.rows) {
                            rows = rows.concat(result.rows);
                        }
                        if (command.type & QueryType.DML) {
                            effectedRows += result.effectedRows;
                        }
                    }

                    return {
                        effectedRows: effectedRows,
                        rows: rows
                    } as IQueryResult<FlatObjectLike<TE>>;
                }, option);
                results.push(insertQuery);
            }
        }
        else {
            let insertExp = new InsertExpression<TE>(entityExp, []);
            let queryParameters: ISqlParameterValueMap = new Map();
            for (const entry of entries) {
                if (insertExp.paramExps.length + columns.length >= this.queryBuilder.queryLimit.maxParameters) {
                    insertExp.returnings = returnings;
                    const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (resultMap) => {
                        let rows = Enumerable.from<unknown>([]);
                        let effectedRows = 0;
                        for (const [command, result] of resultMap) {
                            if (command.type & QueryType.ADDITIONAL) {
                                continue;
                            }
                            if ((command.type & QueryType.DQL) && result.rows) {
                                rows = rows.concat(result.rows);
                            }
                            if (command.type & QueryType.DML) {
                                effectedRows += result.effectedRows;
                            }
                        }

                        return {
                            effectedRows: effectedRows,
                            rows: rows
                        } as IQueryResult<FlatObjectLike<TE>>;
                    }, option);
                    results.push(insertQuery);
                    insertExp = new InsertExpression<TE>(entityExp, []);
                    queryParameters = new Map();
                }

                const itemExp: SetterObj<TE> = {};
                for (const rel of relations) {
                    const parentEntity = entry.entity[rel.propertyName] as Record<string, unknown>;
                    if (parentEntity) {
                        const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                        const isGeneratedPrimary = parentEntry.state === EntityState.Added && typeof parentEntry.key !== "string";
                        const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.metaData).indexOf(parentEntry);
                        for (const [col, parentCol] of rel.relationMaps) {
                            const paramExp = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), parentCol.type), col);
                            const parameterValue: IQueryParameterValue = {};
                            if (isGeneratedPrimary) {
                                const resolvers: IDeferredParameterResolver[] = [
                                    {
                                        entityMeta: parentEntry.metaData,
                                        entryIndex: index,
                                        resolve(row: Record<string, unknown>) {
                                            parameterValue.value = row[parentCol.columnName];
                                        }
                                    }
                                ];
                                parameterValue.resolvers = resolvers;
                            }
                            else {
                                parameterValue.value = parentEntity[parentCol.propertyName];
                            }
                            queryParameters.set(paramExp, parameterValue);
                            insertExp.paramExps.push(paramExp);
                            itemExp[col.propertyName] = paramExp as SqlParameterExpression<TE[keyof TE]>;
                        }
                    }
                }

                for (const col of columns) {
                    if (itemExp[col.propertyName]) {
                        continue;
                    }

                    const value = entry.entity[col.propertyName];
                    if (value !== undefined) {
                        const param = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), col.type as GenericType<TE[keyof TE]>), col as IColumnMetaData<any, TE[keyof TE]>);
                        queryParameters.set(param, { value: value });
                        itemExp[col.propertyName] = param;
                        insertExp.paramExps.push(param);
                    }
                }

                insertExp.values.push(itemExp);
            }

            insertExp.returnings = returnings;
            const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (resultMap) => {
                let rows = Enumerable.from<unknown>([]);
                let effectedRows = 0;
                for (const [command, result] of resultMap) {
                    if (command.type & QueryType.ADDITIONAL) {
                        continue;
                    }
                    if ((command.type & QueryType.DQL) && result.rows) {
                        rows = rows.concat(result.rows);
                    }
                    if (command.type & QueryType.DML) {
                        effectedRows += result.effectedRows;
                    }
                }

                return {
                    effectedRows: effectedRows,
                    rows: rows
                } as IQueryResult<FlatObjectLike<TE>>;
            }, option);
            results.push(insertQuery);
        }
        return results;
    }
    protected getUpdateQueries<TE extends object>(entityMeta: IEntityMetaData<TE>, entries: IEnumerable<EntityEntry<TE>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult<FlatObjectLike<TE>>>> {
        const results: Array<DeferredQuery<IQueryResult<FlatObjectLike<TE>>>> = [];
        const entryCount = Enumerable.from(entries).count();
        if (entryCount <= 0) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }

        const entityExp = new EntityExpression(entityMeta.type, visitor.newAlias("entity"));
        const relations = entityMeta.relations
            .filter((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        let returnings: IColumnExpression<TE>[] = [];
        if (entityMeta.updateGeneratedColumns.length) {
            returnings = Enumerable.from(entityMeta.primaryKeys).union(entityMeta.updateGeneratedColumns).map(o => {
                if (o instanceof ComputedColumnMetaData) {
                    const result = visitor.visitFunction(o.functionExpression.clone(), [entityExp], { selectExpression: new SelectExpression(entityExp) });
                    return new ComputedColumnExpression(entityExp, result, o.propertyName);
                }
                return new ColumnExpression(entityExp, o);
            }).toArray();
        }

        if (entryCount < 10) {
            for (const entry of entries) {
                const setter: SetterObj<TE> = {};
                const queryParameterMap: ISqlParameterValueMap = new Map();

                const entity = entry.entity;
                const modifiedColumns = Enumerable.from(entry.getModifiedProperties())
                    .map((o) => getColumnMetadata(entityMeta.type, o))
                    .filter((o) => !!o)
                    .toArray();

                for (const rel of relations) {
                    const parentEntity = entry.entity[rel.propertyName] as Record<string, unknown>;
                    if (parentEntity) {
                        const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                        const isGeneratedPrimary = parentEntry.state === EntityState.Added && typeof parentEntry.key !== "string";
                        for (const [col, parentCol] of rel.relationMaps) {
                            ArrayExtension.add(modifiedColumns, col);
                            const paramExp = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), parentCol.type), col);
                            const parameterValue: IQueryParameterValue = {};
                            if (isGeneratedPrimary) {
                                const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.metaData).indexOf(parentEntry);
                                const resolvers: IDeferredParameterResolver[] = [
                                    {
                                        entityMeta: parentEntry.metaData,
                                        entryIndex: index,
                                        resolve(row: Record<string, unknown>) {
                                            parameterValue.value = row[parentCol.columnName];
                                        }
                                    }
                                ];
                                parameterValue.resolvers = resolvers;
                            }
                            else {
                                parameterValue.value = parentEntity[parentCol.propertyName];
                            }

                            queryParameterMap.set(paramExp, parameterValue);
                            setter[col.propertyName] = paramExp as unknown as IExpression<TE[keyof TE]>;
                        }
                    }
                }

                for (const o of modifiedColumns) {
                    if (setter[o.propertyName]) {
                        continue;
                    }

                    const paramExp = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), o.type), o);
                    queryParameterMap.set(paramExp, { value: entity[o.propertyName] });
                    setter[o.propertyName] = paramExp as unknown as IExpression<TE[keyof TE]>;
                }
                if (entityMeta.modifiedDateColumn) {
                    setter[entityMeta.modifiedDateColumn.propertyName] = entityMeta.modifiedDateColumn.defaultExp.body as IExpression<TE[keyof TE]>;
                }
                if (entityMeta.versionColumn && entityMeta.versionColumn.type === BigInt as GenericType) {
                    setter[entityMeta.versionColumn.propertyName] = new AdditionExpression(entityExp.columns.find(o => o.columnName == entityMeta.versionColumn.columnName) as IExpression<bigint>, new ValueExpression(1n));
                }

                const updateExp = new UpdateExpression(entityExp, setter);
                updateExp.paramExps.push(...queryParameterMap.keys());
                for (const colExp of entityExp.primaryColumns) {
                    const parameter = new SqlParameterExpression(new ParameterExpression(`update.${colExp.propertyName}`, colExp.type), colExp.columnMeta);
                    queryParameterMap.set(parameter, { value: entry.getOriginalValue(colExp.propertyName) });
                    updateExp.paramExps.push(parameter);
                    updateExp.addWhere(new StrictEqualExpression(colExp, parameter));
                }

                switch (entityMeta.concurrencyMode) {
                    case "OPTIMISTIC VERSION": {
                        const versionCol: IColumnMetaData<TE, unknown> = entityMeta.versionColumn || entityMeta.modifiedDateColumn;
                        if (!versionCol) {
                            throw new Error(`${entityMeta.name} did not have version column`);
                        }

                        const parameter = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), versionCol.type), versionCol);
                        queryParameterMap.set(parameter, { value: entity[versionCol.propertyName] });
                        updateExp.paramExps.push(parameter);

                        const colExp = updateExp.entity.columns.find((c) => c.propertyName === versionCol.propertyName);
                        const compExp = new StrictEqualExpression(colExp, parameter);
                        updateExp.addWhere(compExp);
                        break;
                    }
                    case "OPTIMISTIC DIRTY": {
                        for (const col of modifiedColumns) {
                            const parameter = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), col.type), col);
                            queryParameterMap.set(parameter, { value: entry.getOriginalValue(col.propertyName) });
                            updateExp.paramExps.push(parameter);
                            const colExp = updateExp.entity.columns.find((c) => c.propertyName === col.propertyName);
                            const compExp = new StrictEqualExpression(colExp, parameter);
                            updateExp.addWhere(compExp);
                        }
                        break;
                    }
                }

                updateExp.returnings = returnings;
                const updateQuery = new DeferredQuery(this, updateExp, queryParameterMap, (resultMap) => {
                    let rows = Enumerable.from<unknown>([]);
                    let effectedRows = 0;
                    for (const [command, result] of resultMap) {
                        if (command.type & QueryType.ADDITIONAL) {
                            continue;
                        }
                        if ((command.type & QueryType.DQL) && result.rows) {
                            rows = rows.concat(result.rows);
                        }
                        if (command.type & QueryType.DML) {
                            effectedRows += result.effectedRows;
                        }
                    }
                    if (entityMeta.concurrencyMode !== "NONE" && effectedRows < 1) {
                        throw new Error("Concurrency Error");
                    }

                    return {
                        effectedRows: effectedRows,
                        rows: rows
                    } as IQueryResult<FlatObjectLike<TE>>;
                }, option);
                results.push(updateQuery);
            }
        }
        else {
            const tvpExp = new SqlTableValueParameterExpression(new ParameterExpression<TE[]>("update", Array), {
                flag: BigInt
            } as any);
            const flagColumn = new ColumnExpression(tvpExp, BigInt, "__flag" as StringKeyOf<TE>, "__flag", false, false);
            const relation = new AndExpression();
            const setter: SetterObj<TE> = {};
            const updateableColumns: IColumnExpression<TE>[] = [];
            for (const column of Enumerable.from(entityExp.columns).orderBy([o => o.isPrimary, "DESC"])) {
                if (column.columnMeta?.generation & ColumnGeneration.Update) {
                    if (column.columnMeta === entityMeta.modifiedDateColumn) {
                        setter[column.propertyName] = column.columnMeta.defaultExp.body as IExpression<TE[keyof TE]>;
                        if (entityMeta.concurrencyMode === "OPTIMISTIC VERSION" && !entityMeta.versionColumn) {
                            const oriValueColumn = new ColumnExpression(tvpExp, column.type, `_ori_${column.propertyName}` as StringKeyOf<TE>, `_ori_${column.columnName}`, false, true, column.columnMeta.columnType);
                            tvpExp.columns.push(oriValueColumn);
                        }
                    }
                    if (column.columnMeta === entityMeta.versionColumn) {
                        if (entityMeta.versionColumn && entityMeta.versionColumn.columnType === "int") {
                            setter[entityMeta.versionColumn.propertyName] = new AdditionExpression(entityExp.versionColumn as IColumnExpression<TE, number>, new ValueExpression(1)) as unknown as IExpression<TE[keyof TE]>;
                        }

                        if (entityMeta.concurrencyMode === "OPTIMISTIC VERSION") {
                            const oriValueColumn = new ColumnExpression(tvpExp, column.type, `_ori_${column.propertyName}` as StringKeyOf<TE>, `_ori_${column.columnName}`, false, true, column.columnMeta.columnType);
                            tvpExp.columns.push(oriValueColumn);
                        }
                    }
                    continue;
                }

                const newValueColumn = new ColumnExpression(tvpExp, column.type, column.propertyName, column.columnName, false, true, column.columnMeta.columnType);
                tvpExp.columns.push(newValueColumn);
                if (column.isPrimary) {
                    newValueColumn.propertyName = `_ori_${column.propertyName}` as StringKeyOf<TE>;
                    newValueColumn.columnName = `_ori_${column.columnName}`;
                    relation.operands.push(new StrictEqualExpression(column, newValueColumn));
                    continue;
                }

                if (entityMeta.concurrencyMode === "OPTIMISTIC DIRTY") {
                    const oriValueColumn = new ColumnExpression(tvpExp, column.type, `_ori_${column.propertyName}` as StringKeyOf<TE>, `_ori_${column.columnName}`, false, true, column.columnMeta.columnType);
                    tvpExp.columns.push(oriValueColumn);
                }

                // NOTE: updated.flag&1 == 0 ? current.column : updated.column
                const index = updateableColumns.length - 1;
                setter[column.propertyName] = new TernaryExpression<TE[keyof TE]>(new StrictEqualExpression(new BitwiseAndExpression(flagColumn, new ValueExpression(Math.pow(2, index))), new ValueExpression(0)), column as IColumnExpression<TE, TE[keyof TE]>, newValueColumn as IColumnExpression<TE, TE[keyof TE]>);
            }

            tvpExp.columns.push(flagColumn);
            const updateExp = new UpdateExpression(entityExp, setter);
            updateExp.returnings = returnings;
            updateExp.paramExps.push(tvpExp);

            switch (entityMeta.concurrencyMode) {
                case "OPTIMISTIC VERSION": {
                    const versionCol: IColumnMetaData<TE, unknown, unknown> = entityMeta.versionColumn || entityMeta.modifiedDateColumn;
                    if (!versionCol) {
                        throw new Error(`${entityMeta.name} did not have version column`);
                    }

                    const curVersionCol = entityExp.columns.find(o => o.propertyName == versionCol.propertyName);
                    const oriValueVersionCol = tvpExp.columns.find(o => o.propertyName == `_ori_${versionCol.propertyName}`);
                    updateExp.addWhere(new StrictEqualExpression(curVersionCol, oriValueVersionCol));
                    break;
                }
                case "OPTIMISTIC DIRTY": {
                    for (let i = 0, len = updateableColumns.length; i < len; i++) {
                        const col = updateableColumns[i];
                        const oriValueCol = tvpExp.columns.find(o => o.propertyName == `_ori_${col.propertyName}`);
                        // NOTE: updated.flag&1 == 0 or current.column=updated._ori_column
                        const flagExp = new StrictEqualExpression(new BitwiseAndExpression(flagColumn, new ValueExpression(Math.pow(2, i))), new ValueExpression(0));
                        const columnCheckExp = new StrictEqualExpression(col, oriValueCol);
                        updateExp.addWhere(new OrExpression(flagExp, columnCheckExp));
                    }
                    break;
                }
            }

            const valueSelectExp = new SelectExpression(tvpExp);
            valueSelectExp.selects = tvpExp.columns.filter((o) => !o.isPrimary);
            valueSelectExp.isSubSelect = true;
            updateExp.addJoin(valueSelectExp, relation.asOperand(), "INNER");

            const paramValue: IQueryParameterValue<Partial<TE>[]> = {
                value: [],
                resolvers: []
            };
            for (const entry of entries) {
                const row: Partial<TE> = {};
                const entity = entry.entity;
                const modifieds = new Set(entry.getModifiedProperties());
                const modifiedRelations = new Set<StringKeyOf<TE>>();
                let flag = 0;

                for (const rel of relations) {
                    const parentEntity = entry.entity[rel.propertyName] as Record<string, unknown>;
                    if (parentEntity) {
                        const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                        const isGeneratedPrimary = parentEntry.state === EntityState.Added && typeof parentEntry.key !== "string";
                        const index = isGeneratedPrimary ? parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.metaData).indexOf(parentEntry) : undefined;
                        if (isGeneratedPrimary) {
                            paramValue.resolvers.push({
                                entityMeta: parentEntry.metaData,
                                entryIndex: index,
                                resolve(data: Record<string, unknown>) {
                                    for (const [col, parentCol] of rel.relationMaps) {
                                        row[col.propertyName] = data[parentCol.columnName] as TE[Extract<keyof TE, string>];
                                    }
                                }
                            });
                        }

                        for (const [col, parentCol] of rel.relationMaps) {
                            modifiedRelations.add(col.propertyName);
                            if (isGeneratedPrimary) {
                                continue;
                            }

                            row[col.propertyName] = parentEntity[parentCol.propertyName] as TE[Extract<keyof TE, string>];
                        }
                    }
                }

                for (let i = 0, len = tvpExp.columns.length; i < len; i++) {
                    const col = tvpExp.columns[i];
                    if (col.isPrimary) {
                        row[col.propertyName] = entity[col.propertyName];
                        continue;
                    }
                    if (col === flagColumn) {
                        row[col.propertyName] = flag as TE[StringKeyOf<TE>];
                        continue;
                    }

                    if (col.propertyName.indexOf("_ori_") === 0) {
                        const entityPropertyName = col.propertyName.substring("_ori_".length) as StringKeyOf<TE>;
                        row[col.propertyName] = entry.getOriginalValue(entityPropertyName);
                        continue;
                    }

                    if (modifiedRelations.has(col.propertyName)) {
                        flag |= Math.pow(2, i);
                        continue;
                    }

                    if (!modifieds.has(col.propertyName)) {
                        row[col.propertyName] = null;
                        continue;
                    }

                    row[col.propertyName] = entity[col.propertyName];
                    flag |= Math.pow(2, i);
                }
                paramValue.value.push(row);
            }

            const queryParameterMap: ISqlParameterValueMap = new Map([[tvpExp, paramValue]]);
            const updateQuery = new DeferredQuery(this, updateExp, queryParameterMap, (resultMap) => {
                let rows = Enumerable.from<unknown>([]);
                let effectedRows = 0;
                for (const [command, result] of resultMap) {
                    if (command.type & QueryType.ADDITIONAL) {
                        continue;
                    }
                    if ((command.type & QueryType.DQL) && result.rows) {
                        rows = rows.concat(result.rows);
                    }
                    if (command.type & QueryType.DML) {
                        effectedRows += result.effectedRows;
                    }
                }
                if (entityMeta.concurrencyMode !== "NONE" && effectedRows < paramValue.value.length) {
                    throw new Error("Concurrency Error");
                }

                return {
                    effectedRows: effectedRows,
                    rows: rows
                } as IQueryResult<FlatObjectLike<TE>>;
            }, option);
            results.push(updateQuery);
        }

        return results;
    }
    protected getUpsertQueries<TE extends object>(entityMeta: IEntityMetaData<TE>, entries: IEnumerable<EntityEntry<TE>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult<FlatObjectLike<TE>>>> {
        const results: Array<DeferredQuery<IQueryResult<FlatObjectLike<TE>>>> = [];
        if (!Enumerable.from(entries).some()) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const entityExp = new EntityExpression<TE>(entityMeta.type, visitor.newAlias("entity"));
        const relations = Enumerable.from(entityMeta.relations)
            .filter((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        const columns = Enumerable.from(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns)
            .toArray();

        let generatedColumns = Enumerable.from(entityMeta.insertGeneratedColumns)
            .union(Enumerable.from(entityMeta.columns).filter((o) => !!o.defaultExp))
            .union(entityMeta.updateGeneratedColumns);
        let returnings: IColumnExpression[] = [];
        if (generatedColumns.some()) {
            returnings = Enumerable.from(entityMeta.primaryKeys).union(generatedColumns).map(o => {
                if (o instanceof ComputedColumnMetaData) {
                    const result = visitor.visitFunction(o.functionExpression.clone(), [entityExp], { selectExpression: new SelectExpression(entityExp) });
                    return new ComputedColumnExpression(entityExp, result, o.propertyName);
                }
                return new ColumnExpression(entityExp, o);
            }).toArray();
        }

        const isInsertEntries = entries.find(o => true).state === EntityState.Added;
        if (isInsertEntries) {
            let upsertExp = new UpsertExpression<TE>(entityExp, []);
            let queryParameters: ISqlParameterValueMap = new Map();
            for (const entry of entries) {
                if (upsertExp.paramExps.length + columns.length >= this.queryBuilder.queryLimit.maxParameters) {
                    upsertExp.returnings = returnings;
                    const upsertQuery = new DeferredQuery(this, upsertExp, queryParameters, (resultMap) => {
                        let rows = Enumerable.from<unknown>([]);
                        let effectedRows = 0;
                        for (const [command, result] of resultMap) {
                            if (command.type & QueryType.ADDITIONAL) {
                                continue;
                            }
                            if ((command.type & QueryType.DQL) && result.rows) {
                                rows = rows.concat(result.rows);
                            }
                            if (command.type & QueryType.DML) {
                                effectedRows += result.effectedRows;
                            }
                        }

                        return {
                            effectedRows: effectedRows,
                            rows: rows
                        } as IQueryResult<FlatObjectLike<TE>>;
                    }, option);
                    results.push(upsertQuery);
                    upsertExp = new UpsertExpression<TE>(entityExp, []);
                    queryParameters = new Map();
                }

                const itemExp: SetterObj<TE> = {};
                for (const rel of relations) {
                    const parentEntity = entry.entity[rel.propertyName] as Record<string, unknown>;
                    if (parentEntity) {
                        const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                        const isGeneratedPrimary = parentEntry.state === EntityState.Added && typeof parentEntry.key !== "string";
                        const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.metaData).indexOf(parentEntry);
                        for (const [col, parentCol] of rel.relationMaps) {
                            const paramExp = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), parentCol.type), col);
                            const parameterValue: IQueryParameterValue = {};
                            if (isGeneratedPrimary) {
                                const resolvers: IDeferredParameterResolver[] = [
                                    {
                                        entityMeta: parentEntry.metaData,
                                        entryIndex: index,
                                        resolve(row: Record<string, unknown>) {
                                            parameterValue.value = row[parentCol.columnName];
                                        }
                                    }
                                ];
                                parameterValue.resolvers = resolvers;
                            }
                            else {
                                parameterValue.value = parentEntity[parentCol.propertyName];
                            }
                            queryParameters.set(paramExp, parameterValue);
                            upsertExp.paramExps.push(paramExp);
                            itemExp[col.propertyName] = paramExp as SqlParameterExpression<TE[keyof TE]>;
                        }
                    }
                }

                for (const col of columns) {
                    if (itemExp[col.propertyName]) {
                        continue;
                    }

                    const value = entry.entity[col.propertyName];
                    if (value !== undefined) {
                        const param = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), col.type as GenericType<TE[keyof TE]>), col as IColumnMetaData<any, TE[keyof TE]>);
                        queryParameters.set(param, { value: value });
                        itemExp[col.propertyName] = param;
                        upsertExp.paramExps.push(param);
                    }
                }

                upsertExp.values.push(itemExp);
            }

            upsertExp.returnings = returnings;
            const upsertQuery = new DeferredQuery(this, upsertExp, queryParameters, (resultMap) => {
                let rows = Enumerable.from<unknown>([]);
                let effectedRows = 0;
                for (const [command, result] of resultMap) {
                    if (command.type & QueryType.ADDITIONAL) {
                        continue;
                    }
                    if ((command.type & QueryType.DQL) && result.rows) {
                        rows = rows.concat(result.rows);
                    }
                    if (command.type & QueryType.DML) {
                        effectedRows += result.effectedRows;
                    }
                }

                return {
                    effectedRows: effectedRows,
                    rows: rows
                } as IQueryResult<FlatObjectLike<TE>>;
            }, option);
            results.push(upsertQuery);
        }
        else {
            const setterBase: SetterObj<TE> = {};
            if (entityMeta.modifiedDateColumn) {
                setterBase[entityMeta.modifiedDateColumn.propertyName] = entityMeta.modifiedDateColumn.defaultExp.body as IExpression<TE[keyof TE]>;
            }
            if (entityMeta.versionColumn?.columnType === "int") {
                setterBase[entityMeta.versionColumn.propertyName] = new AdditionExpression(entityExp.versionColumn as IColumnExpression<TE, number>, new ValueExpression(1)) as unknown as IExpression<TE[keyof TE]>;
            }

            for (const entry of entries) {
                const setter = entry.getModifiedProperties().reduce((r, o) => {
                    r[o] = null;
                    return r;
                }, Object.assign({}, setterBase));
                let upsertExp = new UpsertExpression<TE>(entityExp, [], setter);
                let queryParameters: ISqlParameterValueMap = new Map();
                const itemExp: SetterObj<TE> = {};
                for (const rel of relations) {
                    const parentEntity = entry.entity[rel.propertyName] as Record<string, unknown>;
                    if (parentEntity) {
                        const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                        const isGeneratedPrimary = parentEntry.state === EntityState.Added && typeof parentEntry.key !== "string";
                        const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.metaData).indexOf(parentEntry);
                        for (const [col, parentCol] of rel.relationMaps) {
                            const paramExp = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), parentCol.type), col);
                            const parameterValue: IQueryParameterValue = {};
                            if (isGeneratedPrimary) {
                                const resolvers: IDeferredParameterResolver[] = [
                                    {
                                        entityMeta: parentEntry.metaData,
                                        entryIndex: index,
                                        resolve(row: Record<string, unknown>) {
                                            parameterValue.value = row[parentCol.columnName];
                                        }
                                    }
                                ];
                                parameterValue.resolvers = resolvers;
                            }
                            else {
                                parameterValue.value = parentEntity[parentCol.propertyName];
                            }
                            queryParameters.set(paramExp, parameterValue);
                            upsertExp.paramExps.push(paramExp);
                            itemExp[col.propertyName] = paramExp as SqlParameterExpression<TE[keyof TE]>;
                        }
                    }
                }

                for (const col of columns) {
                    if (itemExp[col.propertyName]) {
                        continue;
                    }

                    const value = entry.entity[col.propertyName];
                    if (value !== undefined) {
                        const param = new SqlParameterExpression(new ParameterExpression(visitor.newAlias("param"), col.type as GenericType<TE[keyof TE]>), col as IColumnMetaData<any, TE[keyof TE]>);
                        queryParameters.set(param, { value: value });
                        itemExp[col.propertyName] = param;
                        upsertExp.paramExps.push(param);
                    }
                }

                upsertExp.values.push(itemExp);
                upsertExp.returnings = returnings;
                const upsertQuery = new DeferredQuery(this, upsertExp, queryParameters, (resultMap) => {
                    let rows = Enumerable.from<unknown>([]);
                    let effectedRows = 0;
                    for (const [command, result] of resultMap) {
                        if (command.type & QueryType.ADDITIONAL) {
                            continue;
                        }
                        if ((command.type & QueryType.DQL) && result.rows) {
                            rows = rows.concat(result.rows);
                        }
                        if (command.type & QueryType.DML) {
                            effectedRows += result.effectedRows;
                        }
                    }

                    return {
                        effectedRows: effectedRows,
                        rows: rows
                    } as IQueryResult<FlatObjectLike<TE>>;
                }, option);
                results.push(upsertQuery);
            }
        }

        return results;
    }
    //#endregion
}
