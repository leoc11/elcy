import type { IQueryCacheManager } from "../Cache/IQueryCacheManager";
import type { IResultCacheManager } from "../Cache/IResultCacheManager";
import { QueryType } from "../Common/Enum";
import type { DbType, DeleteMode, IsolationLevel } from "../Common/StringType";
import type { FlatObjectLike, IObjectType, RawSchema, ValueType } from "../Common/Type";
import { DefaultConnectionManager } from "../Connection/DefaultConnectionManager";
import type { IConnection } from "../Connection/IConnection";
import type { IConnectionManager } from "../Connection/IConnectionManager";
import type { IDriver } from "../Connection/IDriver";
import { Enumerable } from "@elcy/enumerable";
import type { IEnumerable } from "@elcy/enumerable";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import type { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { OrExpression } from "../ExpressionBuilder/Expression/OrExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { Diagnostic } from "../Logger/Diagnostic";
import { IntegerColumnMetaData } from "../MetaData/IntegerColumnMetaData";
import type { IDeleteEventParam } from "../MetaData/Interface/IDeleteEventParam";
import type { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import type { ISaveEventParam } from "../MetaData/Interface/ISaveEventParam";
import { DeferredQuery } from "../Query/DeferredQuery";
import type { IQuery } from "../Query/IQuery";
import type { IQueryBuilder } from "../Query/IQueryBuilder";
import type { IQueryOption, ISaveChangesOption } from "../Query/IQueryOption";
import type { IQueryParameterMap } from "../Query/IQueryParameter";
import type { IQueryResult } from "../Query/IQueryResult";
import type { IQueryResultParser } from "../Query/IQueryResultParser";
import type { IQueryVisitor } from "../Query/IQueryVisitor";
import type { ISchemaBuilder } from "../Query/ISchemaBuilder";
import { NamingStrategy } from "../Query/NamingStrategy";
import { QueryTranslator } from "../Query/QueryTranslator";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import type { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { insertEntryExp, InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import type { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { RawSqlExpression } from "../Queryable/QueryExpression/RawSqlExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression, updateItemExp } from "../Queryable/QueryExpression/UpdateExpression";
import { upsertEntryExp, UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";
import { DbSet } from "./DbSet";
import { EntityEntry } from "./EntityEntry";
import { EntityState } from "./EntityState";
import { DBEventEmitter } from "./Event/DbEventEmitter";
import type { IDBEventListener } from "./Event/IDBEventListener";
import { EmbeddedEntityEntryMap } from "./EmbeddedEntityEntryMap";
import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { EntityChangeMap } from "./EntityChangeMap";
import { RawQueryView } from "./RawQueryView";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";

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
    constructor(factory?: () => IConnectionManager<TDB> | IDriver<TDB>, types: IObjectType[] = []) {
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
    public readonly entityTypes: Array<IObjectType>;
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
            p.value = queryBuilder.toParameterValue(p.value, key.column);
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

    //#region Update
    public async saveChanges(options?: ISaveChangesOption): Promise<number> {
        if (!this.entityEntries.hasChanges()) {
            return 0;
        }

        const insertQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult<object>>>> = new Map();
        const updateQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult<object>>>> = new Map();
        const deleteQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult>>> = new Map();

        // order by priority
        const orderedEntityAdd = Enumerable.from(this.entityEntries.add).orderBy([(o) => o[0].priority, "ASC"]).toMap((o) => o[0], (o) => o[1]);
        const orderedEntityUpdate = Enumerable.from(this.entityEntries.update).orderBy([(o) => o[0].priority, "ASC"]).toMap((o) => o[0], (o) => o[1]);
        const orderedEntityDelete = Enumerable.from(this.entityEntries.delete).orderBy([(o) => o[0].priority, "DESC"]).toMap((o) => o[0], (o) => o[1]);

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

        // Before add event and generate query
        for (const [entityMeta, addEntries] of orderedEntityAdd) {
            const eventEmitter = getEventEmitter(entityMeta, this);
            eventEmitter.emitBeforeSaveEvent({ type: "insert" }, ...addEntries);
            const insertResult = options && options.useUpsert && !entityMeta.hasIncrementPrimary ? this.getUpsertQueries(entityMeta, addEntries, visitor) : this.getInsertQueries(entityMeta, addEntries, visitor);
            insertQueries.set(entityMeta, insertResult);
        }

        // Before update event and generate query
        for (const [entityMeta, updateEntries] of orderedEntityUpdate) {
            const eventEmitter = getEventEmitter(entityMeta, this);
            eventEmitter.emitBeforeSaveEvent({ type: "update" }, ...updateEntries);
            updateQueries.set(entityMeta, options && options.useUpsert ? this.getUpsertQueries(entityMeta, updateEntries, visitor) : this.getUpdateQueries(entityMeta, updateEntries, visitor));
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
            deleteQueries.set(entityMeta, this.getDeleteQueries(entityMeta, deleteEntries, visitor, deleteMode));
        }

        const identityInsertQueries = Enumerable.from(insertQueries).filter((o) => o[0].hasIncrementPrimary);
        const nonIdentityInsertQueries = Enumerable.from(insertQueries).filter((o) => !o[0].hasIncrementPrimary);

        // execute all in transaction;
        await this.transaction(async () => {
            // execute delete
            await this.executeDeferred(Enumerable.from(deleteQueries).flatMap((o) => o[1]));

            const allInsertQueries = identityInsertQueries
                .concat(nonIdentityInsertQueries).enableCache(true);

            // execute all identity insert queries
            let i = 0;
            for (const [entityMeta, queries] of identityInsertQueries) {
                await this.executeDeferred(queries);

                i++;
                const values = queries.flatMap((o) => o.value.rows);
                const transformer = new ExpressionExecutor(values as { [key: number]: unknown });
                for (const dQ of allInsertQueries.slice(i).flatMap((o) => o[1])) {
                    for (const [k, p] of Enumerable.from(dQ.parameters).filter(([, param]) => param.name === entityMeta.name)) {
                        p.value = transformer.execute(k.valueExp);
                    }
                }
            }

            const allQueries = nonIdentityInsertQueries.flatMap((o) => o[1])
                .concat(Enumerable.from(updateQueries.values()).flatMap((o) => o));
            await this.executeDeferred(allQueries);

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
                let insertedData: IterableIterator<unknown> = null;
                if (entityMeta.insertGeneratedColumns.length) {
                    insertedData = Enumerable.from(queries).flatMap((o) => o.value.rows)[Symbol.iterator]();
                }

                const entityEntries = orderedEntityAdd.get(entityMeta);
                for (const entityEntry of entityEntries) {
                    if (insertedData) {
                        const data = insertedData.next().value as Record<string, unknown>;
                        for (const prop in data) {
                            const column = entityMeta.columns.find((o) => o.columnName === prop);
                            if (column) {
                                entityEntry.entity[prop as keyof object] = this.queryBuilder.toPropertyValue(data[prop], column) as never;
                            }
                        }
                    }
                    eventEmitter.emitAfterSaveEvent({ type: "insert" }, entityEntry);
                }
            }

            // accept update changes.
            for (const [entityMeta, queries] of updateQueries) {
                const eventEmitter = getEventEmitter(entityMeta, this);
                const dbSet = this.set(entityMeta.type);
                const updateData = Enumerable.from(queries).flatMap((o) => o.value.rows).toMap((o: object) => dbSet.getKey(o), (o: object) => o);
                const entityEntries = orderedEntityUpdate.get(entityMeta);
                for (const entityEntry of entityEntries) {
                    const data = updateData.get(entityEntry.key) as Record<string, unknown>;
                    if (data) {
                        for (const prop in data) {
                            const column = entityMeta.columns.find((o) => o.columnName === prop);
                            if (column) {
                                entityEntry.entity[prop as keyof object] = this.queryBuilder.toPropertyValue(data[prop], column) as never;
                            }
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
            result = this._cachedDbSets.get(type) as unknown as DbSet<T>;
        }
        if (!result && this.entityTypes.includes(type)) {
            result = new DbSet(type, this);
            this._cachedDbSets.set(type, result as unknown as DbSet);
        }
        return result;
    }
    public async syncSchema() {
        const schemaQuery = await this.getUpdateSchemaQueries(this.entityTypes);
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
        const deleteExp = new DeleteExpression(entityExp);
        if (deleteMode) {
            deleteExp.deleteMode = new ValueExpression(deleteMode);
        }

        const queryParameters: IQueryParameterMap = new Map();
        const hasCompositeKeys = entityMeta.primaryKeys.length > 1;
        let whereExp: IExpression<boolean>;

        if (hasCompositeKeys) {
            for (const entry of entries) {
                let primaryExp: IExpression<boolean>;
                for (const col of entityExp.primaryColumns) {
                    const parameter = new SqlParameterExpression(new ParameterExpression("", col.type), col.columnMeta as unknown as IColumnMetaData<object, ValueType>);
                    queryParameters.set(parameter, { value: entry.entity[col.propertyName] });

                    const logicalExp = new StrictEqualExpression(col, parameter);
                    primaryExp = primaryExp ? new AndExpression(primaryExp, logicalExp) : logicalExp;
                }
                whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
            }
        }
        else {
            const arrayValue = new ArrayValueExpression();
            const primaryKey = entityExp.primaryColumns.find(() => true);
            for (const entry of entries) {
                const parameter = new SqlParameterExpression(new ParameterExpression("", primaryKey.type), primaryKey.columnMeta as unknown as IColumnMetaData<object, ValueType>);
                queryParameters.set(parameter, { value: entry.entity[primaryKey.propertyName] });
                arrayValue.items.push(parameter);
            }
            whereExp = new MethodCallExpression(arrayValue, "includes", entityExp.primaryColumns);
        }

        if (whereExp) {
            deleteExp.addWhere(whereExp);
            deleteExp.paramExps = Array.from(queryParameters.keys());
            const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (queryRes) => {
                return {
                    effectedRows: Enumerable.from(queryRes).sum((o) => o.effectedRows),
                    rows: []
                } as IQueryResult;
            }, option);
            results.push(deleteQuery);
        }
        return results;
    }
    protected getInsertQueries<T extends object>(entityMeta: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> {
        const results: Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> = [];
        if (!entries.some(() => true)) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const entityExp = new EntityExpression<T>(entityMeta.type, visitor.newAlias());
        const relations = Enumerable.from(entityMeta.relations)
            .filter((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        const columns = relations.flatMap((o) => o.relationColumns)
            .union(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns).distinct();

        let generatedColumns = Enumerable.from(entityMeta.insertGeneratedColumns).union(Enumerable.from(entityMeta.columns).filter((o) => !!o.defaultExp));
        const hasGeneratedColumn = generatedColumns.some();
        if (hasGeneratedColumn) {
            generatedColumns = Enumerable.from(entityMeta.primaryKeys).union(generatedColumns);
        }

        if (entityMeta.hasIncrementPrimary) {
            const queryBuilder = this.queryBuilder;
            // if primary key is auto increment, then need to split all query per entry.
            const incrementColumn = entityMeta.primaryKeys.find((o) => (o as unknown as IntegerColumnMetaData).autoIncrement);
            for (const entry of entries) {
                const insertExp = new InsertExpression<T>(entityExp, []);
                const queryParameters: IQueryParameterMap = new Map();
                insertEntryExp(insertExp, entry, columns, relations, queryParameters);

                const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (queryRes) => {
                    return {
                        effectedRows: Enumerable.from(queryRes).sum((o) => o.effectedRows),
                        rows: []
                    } as IQueryResult<FlatObjectLike<T>>;
                }, option);
                results.push(insertQuery);

                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = generatedColumns.map((c) => entityExp.columns.find((e) => e.propertyName === c.propertyName) as unknown as IColumnExpression).toArray();

                const lastId = queryBuilder.lastInsertIdQuery;
                selectExp.addWhere(new StrictEqualExpression(entityExp.columns.find((c) => c.propertyName === incrementColumn.columnName), new RawSqlExpression(incrementColumn.type, lastId)));

                const selectQuery = new DeferredQuery(this, selectExp, new Map(), (queryRes) => {
                    return {
                        effectedRows: 0,
                        rows: queryRes.flatMap((o) => o.rows)
                    } as IQueryResult<FlatObjectLike<T>>;
                }, option);
                results.push(selectQuery);
            }
        }
        else {
            const insertExp = new InsertExpression<T>(entityExp, []);
            const queryParameters: IQueryParameterMap = new Map();

            let isCompositePrimaryKey: boolean;
            let primaryKey: IColumnExpression<T>;
            let whereExp: IExpression<boolean>;
            let arrayValue: ArrayValueExpression;
            if (hasGeneratedColumn) {
                arrayValue = new ArrayValueExpression();
                isCompositePrimaryKey = entityMeta.primaryKeys.length > 1;
                if (!isCompositePrimaryKey) {
                    primaryKey = entityExp.primaryColumns[0];
                }
            }

            const selectQueryParameters: IQueryParameterMap = new Map();
            for (const entry of entries) {
                const itemExp = insertEntryExp(insertExp, entry, columns, relations, queryParameters);

                if (hasGeneratedColumn) {
                    if (isCompositePrimaryKey) {
                        let primaryExp: IExpression<boolean>;
                        for (const col of insertExp.entity.primaryColumns) {
                            const paramExp = itemExp[col.propertyName];
                            const logicalExp = new StrictEqualExpression(col, paramExp);
                            primaryExp = primaryExp ? new AndExpression(primaryExp, logicalExp) : logicalExp;
                            if (paramExp instanceof SqlParameterExpression) {
                                const queryParameter = queryParameters.get(paramExp);
                                selectQueryParameters.set(paramExp, queryParameter);
                            }
                        }
                        whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
                    }
                    else {
                        const paramExp = itemExp[primaryKey.propertyName];
                        arrayValue.items.push(paramExp);
                        if (paramExp instanceof SqlParameterExpression) {
                            const queryParameter = queryParameters.get(paramExp);
                            selectQueryParameters.set(paramExp, queryParameter);
                        }
                    }
                }
            }

            const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (queryRes) => {
                return {
                    effectedRows: Enumerable.from(queryRes).sum((o) => o.effectedRows),
                    rows: []
                } as IQueryResult<FlatObjectLike<T>>;
            }, option);
            results.push(insertQuery);

            if (hasGeneratedColumn) {
                if (!isCompositePrimaryKey) {
                    whereExp = new MethodCallExpression(arrayValue, "includes", [primaryKey]);
                }

                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = generatedColumns.map((c) => entityExp.columns.find((e) => e.propertyName === c.propertyName) as unknown as IColumnExpression).toArray();
                selectExp.addWhere(whereExp);

                results.push(new DeferredQuery(this, selectExp, selectQueryParameters, (queryRes) => {
                    return {
                        effectedRows: 0,
                        rows: queryRes.flatMap((o) => o.rows)
                    } as IQueryResult<FlatObjectLike<T>>;
                }, option));
            }
        }

        return results;
    }
    protected getUpdateQueries<T extends object>(entityMetaData: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> {
        const results: Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> = [];
        if (!entries.some(() => true)) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }

        const entityExp = new EntityExpression(entityMetaData.type, visitor.newAlias());

        const autoUpdateColumns = entityMetaData.updateGeneratedColumns;
        const hasUpdateColumn = autoUpdateColumns.some(() => true);
        let selectExp: SelectExpression<T>;
        const selectParameters: IQueryParameterMap = new Map();
        if (hasUpdateColumn) {
            selectExp = new SelectExpression<T>(entityExp);
            selectExp.selects = Enumerable.from(entityMetaData.primaryKeys).union(autoUpdateColumns).map((o) => entityExp.columns.find((c) => c.propertyName === o.propertyName) as unknown as IColumnExpression).toArray();
        }

        for (const entry of entries) {
            const updateExp = new UpdateExpression(entityExp, {});
            const queryParameters: IQueryParameterMap = new Map();

            let pkFilter: IExpression<boolean>;
            for (const colExp of updateExp.entity.primaryColumns) {
                const parameter = new SqlParameterExpression(new ParameterExpression("", colExp.type), colExp.columnMeta as unknown as IColumnMetaData<object>);
                queryParameters.set(parameter, { value: entry.entity[colExp.propertyName as keyof T] });
                if (hasUpdateColumn) {
                    selectParameters.set(parameter, { value: entry.entity[colExp.propertyName as keyof T] });
                }

                const compExp = new StrictEqualExpression(colExp, parameter);
                pkFilter = pkFilter ? new AndExpression(pkFilter, compExp) : compExp;
            }

            updateExp.addWhere(pkFilter);
            updateItemExp(updateExp, entry, queryParameters);
            if (hasUpdateColumn) {
                selectExp.where = selectExp.where ? new OrExpression(selectExp.where, pkFilter) : pkFilter;
            }

            const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (queryRes) => {
                const effectedRows = Enumerable.from(queryRes).sum((o) => o.effectedRows);
                if (entityMetaData.concurrencyMode !== "NONE" && effectedRows <= 0) {
                    throw new Error("Concurrency Error");
                }
                return {
                    effectedRows: effectedRows,
                    rows: []
                } as IQueryResult<FlatObjectLike<T>>;
            }, option);
            results.push(updateQuery);
        }

        // get changes done by server.
        if (hasUpdateColumn) {
            const selectQuery = new DeferredQuery(this, selectExp, selectParameters, (queryRes) => {
                return {
                    effectedRows: 0,
                    rows: queryRes.flatMap((o) => o.rows)
                } as IQueryResult<FlatObjectLike<T>>;
            }, option);
            results.push(selectQuery);
        }

        return results;
    }
    protected getUpsertQueries<T extends object>(entityMeta: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, param?: IQueryOption): Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> {
        const results: Array<DeferredQuery<IQueryResult<FlatObjectLike<T>>>> = [];
        if (!entries.some(() => true)) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const entityExp = new EntityExpression<T>(entityMeta.type, visitor.newAlias());
        let generatedColumns = Enumerable.from(entityMeta.insertGeneratedColumns).union(entityMeta.updateGeneratedColumns);
        const hasGeneratedColumn = generatedColumns.some();
        if (hasGeneratedColumn) {
            generatedColumns = Enumerable.from(entityMeta.primaryKeys).union(generatedColumns);
        }

        let isCompositePrimaryKey: boolean;
        let primaryKey: IColumnExpression<T>;
        let whereExp: IExpression<boolean>;
        let arrayValue: ArrayValueExpression;
        if (hasGeneratedColumn) {
            arrayValue = new ArrayValueExpression();
            isCompositePrimaryKey = entityMeta.primaryKeys.length > 1;
            if (!isCompositePrimaryKey) {
                primaryKey = entityExp.primaryColumns.find(() => true);
            }
        }

        for (const entry of entries) {
            const upsertExp = new UpsertExpression(entityExp, {});
            upsertExp.updateColumns = entry.state === EntityState.Added ? entityExp.columns.filter((o) => !o.isPrimary) : entityExp.columns.filter((o) => !o.isPrimary && entry.isPropertyModified(o.propertyName));

            const queryParameters: IQueryParameterMap = new Map();
            upsertEntryExp(upsertExp, entry, queryParameters);

            const upsertQuery = new DeferredQuery(this, upsertExp, queryParameters, (queryRes) => {
                return {
                    effectedRows: Enumerable.from(queryRes).max((o) => o.effectedRows),
                    rows: []
                } as IQueryResult<FlatObjectLike<T>>;
            }, param);
            results.push(upsertQuery);

            // select filter
            if (hasGeneratedColumn) {
                if (hasGeneratedColumn) {
                    if (isCompositePrimaryKey) {
                        let primaryExp: IExpression<boolean>;
                        for (const col of upsertExp.entity.primaryColumns) {
                            const logicalExp = new StrictEqualExpression(col, upsertExp.setter[col.propertyName]);
                            primaryExp = primaryExp ? new AndExpression(primaryExp, logicalExp) : logicalExp;
                        }
                        whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
                    }
                    else {
                        arrayValue.items.push(upsertExp.setter[primaryKey.propertyName]);
                    }
                }
            }
        }

        if (hasGeneratedColumn) {
            if (!isCompositePrimaryKey) {
                whereExp = new MethodCallExpression(arrayValue, "includes", [primaryKey]);
            }

            const selectExp = new SelectExpression(entityExp);
            selectExp.selects = generatedColumns.map((c) => entityExp.columns.find((e) => e.propertyName === c.propertyName) as unknown as IColumnExpression).toArray();
            selectExp.addWhere(whereExp);

            results.push(new DeferredQuery(this, selectExp, new Map(Enumerable.from(results).flatMap((o) => o.parameters)), (queryRes) => {
                return {
                    effectedRows: 0,
                    rows: queryRes.flatMap((o) => o.rows)
                } as IQueryResult<FlatObjectLike<T>>;
            }, param));
        }

        return results;
    }
    //#endregion
}
