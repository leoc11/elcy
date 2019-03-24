import "../Extensions/ArrayItemTypeExtension";
import { IObjectType, GenericType, DbType, IsolationLevel, QueryType, DeleteMode, ColumnGeneration } from "../Common/Type";
import { DbSet } from "./DbSet";
import { IQueryResultParser } from "../Query/IQueryResultParser";
import { IQueryCacheManager } from "../Cache/IQueryCacheManager";
import { DefaultQueryCacheManager } from "../Cache/DefaultQueryCacheManager";
import { IQueryResult } from "../Query/IQueryResult";
import { IDBEventListener } from "./Event/IDBEventListener";
import { IDriver } from "../Connection/IDriver";
import { IQuery } from "../Query/IQuery";
import { DBEventEmitter } from "./Event/DbEventEmitter";
import { EntityState } from "./EntityState";
import { EntityEntry } from "./EntityEntry";
import { DeferredQuery } from "../Query/DeferredQuery";
import { RelationEntry } from "./RelationEntry";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";
import { isValue } from "../Helper/Util";
import { IConnectionManager } from "../Connection/IConnectionManager";
import { DefaultConnectionManager } from "../Connection/DefaultConnectionManager";
import { IConnection } from "../Connection/IConnection";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IDeleteEventParam } from "../MetaData/Interface/IDeleteEventParam";
import { IntegerColumnMetaData } from "../MetaData/IntegerColumnMetaData";
import { ISaveEventParam } from "../MetaData/Interface/ISaveEventParam";
import { Enumerable } from "../Enumerable/Enumerable";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryParameter } from "../Query/IQueryParameter";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression, updateItemExp } from "../Queryable/QueryExpression/UpdateExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { OrExpression } from "../ExpressionBuilder/Expression/OrExpression";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { InsertExpression, insertEntryExp } from "../Queryable/QueryExpression/InsertExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { RawSqlExpression } from "../Queryable/QueryExpression/RawSqlExpression";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { NamingStrategy } from "../Query/NamingStrategy";
import { QueryTranslator } from "../Query/QueryTranslator";
import { Diagnostic } from "../Logger/Diagnostic";
import { IResultCacheManager } from "../Cache/IResultCacheManager";
import { UpsertExpression, upsertEntryExp } from "../Queryable/QueryExpression/UpsertExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IQueryBuilder } from "../Query/IQueryBuilder";
import { ISchemaBuilder } from "../Query/ISchemaBuilder";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryOption } from "../Query/IQueryOption";

export type IChangeEntryMap<T extends string, TKey, TValue> = { [K in T]: Map<TKey, TValue[]> };
const connectionManagerKey = Symbol("connectionManagerKey");
const queryCacheManagerKey = Symbol("queryCacheManagerKey");

export abstract class DbContext<T extends DbType = any> implements IDBEventListener<any> {
    public abstract readonly entityTypes: Array<IObjectType<any>>;
    protected abstract readonly queryBuilderType: IObjectType<IQueryBuilder>;
    protected abstract readonly queryVisitorType: IObjectType<IQueryVisitor>;
    protected abstract readonly schemaBuilderType: IObjectType<ISchemaBuilder>;
    protected abstract readonly queryResultParserType: IObjectType<IQueryResultParser>;
    protected abstract readonly namingStrategy: NamingStrategy;
    protected abstract readonly translator: QueryTranslator;
    public abstract readonly dbType: T;
    protected readonly queryCacheManagerType?: IObjectType<IQueryCacheManager>;
    public get queryBuilder(): IQueryBuilder {
        const queryBuilder = new this.queryBuilderType();
        queryBuilder.namingStrategy = this.namingStrategy;
        return queryBuilder;
    }
    public get queryVisitor(): IQueryVisitor {
        const visitor = new this.queryVisitorType();
        visitor.namingStrategy = this.namingStrategy;
        visitor.translator = this.translator;
        return visitor;
    }
    public getQueryResultParser(command: IQueryExpression, queryBuilder: IQueryBuilder): IQueryResultParser {
        return new this.queryResultParserType(command, queryBuilder);
    }
    public deferredQueries: DeferredQuery[] = [];
    private _queryCacheManager: IQueryCacheManager;
    public get queryCacheManager() {
        if (!this._queryCacheManager) {
            this._queryCacheManager = Reflect.getOwnMetadata(queryCacheManagerKey, this.constructor);
            if (!this._queryCacheManager) {
                this._queryCacheManager = this.queryCacheManagerType ? new this.queryCacheManagerType(this.constructor) : new DefaultQueryCacheManager(this.constructor as any);
                Reflect.defineMetadata(queryCacheManagerKey, this._queryCacheManager, this.constructor);
            }
        }

        return this._queryCacheManager;
    }
    public resultCacheManager: IResultCacheManager;
    private _connectionManager: IConnectionManager;
    public get connectionManager() {
        if (!this._connectionManager) {
            this._connectionManager = Reflect.getOwnMetadata(connectionManagerKey, this.constructor);
            if (!this._connectionManager) {
                const val = this.factory();
                if ((val as IConnectionManager).getAllConnections) {
                    this._connectionManager = val as IConnectionManager;
                }
                else {
                    const driver = val as IDriver<T>;
                    this._connectionManager = new DefaultConnectionManager(driver);
                }
                Reflect.defineMetadata(connectionManagerKey, this._connectionManager, this.constructor);
            }
        }

        return this._connectionManager;
    }
    public connection?: IConnection;
    public async getConnection(writable?: boolean) {
        const con = this.connection ? this.connection : await this.connectionManager.getConnection(writable);
        if (Diagnostic.enabled) Diagnostic.trace(this, `Get connection. used existing connection: ${!!this.connection}`);
        return con;
    }
    public async closeConnection(con?: IConnection) {
        if (!con)
            con = this.connection;
        if (con && !con.inTransaction) {
            if (Diagnostic.enabled) Diagnostic.trace(this, `Close connection.`);
            this.connection = null;
            await con.close();
        }
    }
    private _cachedDbSets: Map<IObjectType, DbSet<any>> = new Map();
    constructor(protected readonly factory: () => IConnectionManager | IDriver<T>) {
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

    //#region Entity Tracker
    public set<T>(type: IObjectType<T>, isClearCache = false): DbSet<T> {
        let result: DbSet<T> = isClearCache ? undefined as any : this._cachedDbSets.get(type);
        if (!result && this.entityTypes.contains(type)) {
            result = new DbSet(type, this);
            this._cachedDbSets.set(type, result);
        }
        return result;
    }
    public entry<T>(entity: T) {
        const set = this.set<T>(entity.constructor as any);
        if (set) {
            return set.entry(entity);
        }
        return undefined;
    }
    public attach<T>(entity: T, all = false) {
        const entry = this.entry(entity);
        if (entry && entry.state === EntityState.Detached) {
            entry.state = EntityState.Unchanged;
            if (all) {
                for (const relation of entry.metaData.relations) {
                    const relEntity = entity[relation.propertyName];
                    if (relEntity) {
                        if (relation.relationType === "one") {
                            const relEntry = this.attach(relEntity, true);
                            const relationEntry = this.relationEntry(entry, relation.propertyName, relEntry);
                            relationEntry.state = EntityState.Unchanged;
                        }
                        else if (Array.isArray(relEntity)) {
                            for (const itemEntity of relEntity) {
                                const relEntry = this.attach(itemEntity, true);
                                const relationEntry = this.relationEntry(entry, relation.propertyName, relEntry);
                                relationEntry.state = EntityState.Unchanged;
                            }
                        }
                    }
                }
                for (const relation of entry.metaData.embeds) {
                    const relEntity = entity[relation.propertyName];
                    if (relEntity) {
                        const relEntry = this.attach(relEntity, true);
                        if (relEntry) entity[relation.propertyName] = relEntry.entity;
                    }
                }
            }
        }

        return entry;
    }
    public add<T>(entity: T) {
        const entry = this.attach(entity);
        entry.add();
        if (entry) {
            entry.add();
        }
        return entry;
    }
    public delete<T>(entity: T) {
        const entry = this.attach(entity);
        if (entry) {
            entry.delete();
        }
        return entry;
    }
    public update<T>(entity: T, originalValues?: { [key in keyof T]: T[key] }) {
        const entry = this.attach(entity);
        if (entry) {
            if (originalValues instanceof Object)
                entry.setOriginalValues(originalValues);
            entry.state = EntityState.Modified;
        }
        return entry;
    }
    public entityEntries: IChangeEntryMap<"add" | "update" | "delete", IEntityMetaData, EntityEntry>;
    public relationEntries: IChangeEntryMap<"add" | "delete", IRelationMetaData, RelationEntry>;
    public modifiedEmbeddedEntries: Map<IEntityMetaData<any>, Array<EmbeddedEntityEntry>> = new Map();
    public clear() {
        this.modifiedEmbeddedEntries.clear();
        this.relationEntries.add.clear();
        this.relationEntries.delete.clear();
        this.entityEntries.delete.clear();
        this.entityEntries.add.clear();
        this.entityEntries.update.clear();
        for (const [, dbSet] of this._cachedDbSets) {
            dbSet.clear();
        }
    }

    public relationEntry(entry: EntityEntry, propertyName: string, childEntry: EntityEntry) {
        if (!childEntry) throw new Error("Child Entry null");

        const relationMeta = entry.metaData.relations.first(o => o.propertyName === propertyName);
        if (!relationMeta) {
            throw new Error("Relation not exist");
        }

        return entry.getRelation(relationMeta.fullName, childEntry);
    }
    //#endregion

    public async executeQueries(...queries: IQuery[]): Promise<IQueryResult[]> {
        let results: IQueryResult[] = [];
        if (queries.any()) {
            const con = await this.getConnection(queries.any(o => (o.type & QueryType.DQL) && true));
            if (!con.isOpen) await con.open();
            const timer = Diagnostic.timer(false);
            for (const query of queries) {
                timer && timer.start();
                if (Diagnostic.enabled) Diagnostic.debug(con, `Execute Query.`, query);
                const res = await con.executeQuery(query);
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
    public async transaction(transactionBody: () => Promise<void>): Promise<void>;
    public async transaction(isolationLevel: IsolationLevel, transactionBody: () => Promise<void>): Promise<void>;
    public async transaction(isolationOrBody: IsolationLevel | (() => Promise<void>), transactionBody?: () => Promise<void>): Promise<void> {
        let isSavePoint;
        try {
            let isolationLevel: IsolationLevel;
            if (typeof isolationOrBody === "function")
                transactionBody = isolationOrBody;
            else
                isolationLevel = isolationOrBody;

            this.connection = await this.getConnection(true);
            if (!this.connection.isOpen) await this.connection.open();

            isSavePoint = this.connection.inTransaction;
            await this.connection.startTransaction(isolationLevel);
            if (Diagnostic.enabled) Diagnostic.debug(this.connection, isSavePoint ? "Set transaction save point" : "Start transaction");
            await transactionBody();
            await this.connection.commitTransaction();
            if (Diagnostic.enabled) Diagnostic.debug(this.connection, isSavePoint ? "commit transaction save point" : "Commit transaction");
            if (!isSavePoint) await this.closeConnection();
        }
        catch (e) {
            if (Diagnostic.enabled) Diagnostic.error(this.connection, e instanceof Error ? e.message : "Error", e);
            await this.connection.rollbackTransaction();
            if (Diagnostic.enabled) Diagnostic.debug(this.connection, isSavePoint ? "rollback transaction save point" : "rollback transaction");
            if (isSavePoint === false) await this.closeConnection();
            throw e;
        }
    }
    public async executeDeferred(deferredQueries?: Iterable<DeferredQuery>) {
        if (!deferredQueries) {
            deferredQueries = this.deferredQueries.splice(0);
        }

        const queryBuilder = this.queryBuilder;
        let deferredQueryEnumerable = Enumerable.from(deferredQueries);

        // check cached
        if (this.resultCacheManager) {
            const cacheQueries = deferredQueryEnumerable.where(o => o.command instanceof SelectExpression && o.option.resultCache !== "none");
            const cachedResults = await this.resultCacheManager.gets(...cacheQueries.select(o => o.hashCode().toString()).toArray());
            let index = 0;
            cacheQueries.each(cacheQuery => {
                const res = cachedResults[index++];
                if (res) {
                    cacheQuery.buildQuery(queryBuilder);
                    cacheQuery.resolve(res);
                    deferredQueryEnumerable = deferredQueryEnumerable.where(o => o !== cacheQuery);
                }
            });
        }

        // analyze parameters
        // db has parameter size limit and query size limit.
        const paramPrefix = queryBuilder.namingStrategy.getAlias("param");
        let i = 0;
        deferredQueryEnumerable.selectMany(o => o.parameters).groupBy(o => o.value)
            .each(o => {
                const alias = paramPrefix + i++;
                o.each(p => {
                    p.name = alias;
                    p.value = queryBuilder.toParameterValue(p.value, p.paramExp.column);
                });
            });

        const mergedQueries = queryBuilder.mergeQueries(deferredQueryEnumerable.selectMany(o => {
            return o.buildQuery(queryBuilder);
        }));
        const queryResult: IQueryResult[] = await this.executeQueries(...mergedQueries);
        for (const deferredQuery of deferredQueryEnumerable) {
            const results = queryResult.splice(0, deferredQuery.queries.length);
            deferredQuery.resolve(results);

            // cache result
            if (this.resultCacheManager) {
                if (deferredQuery.command instanceof SelectExpression) {
                    const option = deferredQuery.command.option;
                    if (option.resultCache !== "none") {
                        if (option.resultCache && !option.resultCache.disableEntityAsTag)
                            option.resultCache.tags = option.resultCache.tags.union(deferredQuery.command.getEffectedEntities().select(o => `entity:${o.name}`)).distinct().toArray();
                        this.resultCacheManager.set(deferredQuery.hashCode().toString(), results, option.resultCache);
                    }
                }
                else {
                    const effecteds = deferredQuery.command.getEffectedEntities().select(o => `entity:${o.name}`).toArray();
                    this.resultCacheManager.removeTag(...effecteds);
                }
            }
        }
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
    public async getUpdateSchemaQueries(entityTypes: IObjectType[]) {
        const con = await this.getConnection();
        if (!con.isOpen) await con.open();
        const schemaBuilder = new this.schemaBuilderType();
        schemaBuilder.connection = con;
        schemaBuilder.queryBuilder = this.queryBuilder;
        return await schemaBuilder.getSchemaQuery(entityTypes);
    }

    // -------------------------------------------------------------------------
    // Query Function
    // -------------------------------------------------------------------------
    public async deferredFromSql<T>(type: GenericType<T>, rawQuery: string, parameters?: { [key: string]: any }) {
        const queryCommand: IQuery = {
            query: rawQuery,
            parameters: {},
            type: QueryType.DDL
        };
        const command: IQueryExpression = {
            paramExps: [],
            type: type as any,
            clone: () => command,
            hashCode: () => 0,
            getEffectedEntities: () => []
        };
        if (parameters) {
            Object.assign(queryCommand.parameters, parameters);
        }
        const query = new DeferredQuery(this, command, [], (result) => result.selectMany(o => o.rows).select(o => {
            let item = new (type as any)();
            if (isValue(item)) {
                item = o[Object.keys(o).first()];
            }
            else {
                for (const prop in o) {
                    item[prop] = o[prop];
                }
            }
            return item;
        }).toArray(), {});
        return query;
    }
    public async fromSql<T>(type: GenericType<T>, rawQuery: string, parameters?: { [key: string]: any }): Promise<T[]> {
        const query = await this.deferredFromSql(type, rawQuery, parameters);
        return await query.execute();
    }

    //#region DB Event Listener
    public beforeSave?: <T>(entity: T, param: ISaveEventParam) => boolean;
    public beforeDelete?: <T>(entity: T, param: IDeleteEventParam) => boolean;
    public afterLoad?: <T>(entity: T) => void;
    public afterSave?: <T>(entity: T, param: ISaveEventParam) => void;
    public afterDelete?: <T>(entity: T, param: IDeleteEventParam) => void;
    //#endregion

    //#region Update
    public async saveChanges(options?: IQueryOption): Promise<number> {
        const insertQueries: Map<IEntityMetaData, DeferredQuery<IQueryResult>[]> = new Map();
        const updateQueries: Map<IEntityMetaData, DeferredQuery<IQueryResult>[]> = new Map();
        const deleteQueries: Map<IEntityMetaData, DeferredQuery<IQueryResult>[]> = new Map();
        const relationDeleteQueries: Map<IRelationMetaData, DeferredQuery<IQueryResult>[]> = new Map();
        const relationAddQueries: Map<IRelationMetaData, DeferredQuery<IQueryResult>[]> = new Map();

        // order by priority
        const orderedEntityAdd = this.entityEntries.add.asEnumerable().orderBy([o => o[0].priority, "ASC"]);
        orderedEntityAdd.enableCache = true;

        const orderedEntityUpdate = this.entityEntries.update.asEnumerable().orderBy([o => o[0].priority, "ASC"]);
        const orderedEntityDelete = this.entityEntries.delete.asEnumerable().orderBy([o => o[0].priority, "DESC"]);

        const orderedRelationAdd = this.relationEntries.add.asEnumerable().orderBy([o => o[0].source.priority, "ASC"]);
        orderedRelationAdd.enableCache = true;

        const orderedRelationDelete = this.relationEntries.delete.asEnumerable().orderBy([o => o[0].source.priority, "DESC"]);
        orderedRelationDelete.enableCache = true;

        const visitor = this.queryVisitor;
        visitor.option = options;

        // apply embedded entity changes
        for (const [, embeddedEntries] of this.modifiedEmbeddedEntries) {
            // TODO: decide whether event emitter required here
            for (const entry of embeddedEntries) {
                if (entry.parentEntry.state === EntityState.Unchanged)
                    entry.parentEntry.state = EntityState.Modified;
                continue;
            }
        }

        // Before add event and generate query
        orderedEntityAdd.each(([entityMeta, addEntries]) => {
            const eventEmitter = new DBEventEmitter(this, entityMeta);
            for (const entry of addEntries) {
                eventEmitter.emitBeforeSaveEvent(entry.entity, { type: "insert" });
            }
            const insertResult = options && options.useUpsert && !entityMeta.hasIncrementPrimary ? this.getUpsertQueries(entityMeta, addEntries, visitor) : this.getInsertQueries(entityMeta, addEntries, visitor);
            insertQueries.set(entityMeta, insertResult);
        });

        // Before update event and generate query
        orderedEntityUpdate.each(([entityMeta, updateEntries]) => {
            const eventEmitter = new DBEventEmitter(this, entityMeta);
            for (const entry of updateEntries) {
                eventEmitter.emitBeforeSaveEvent(entry.entity, { type: "update" });
            }
            updateQueries.set(entityMeta, options && options.useUpsert ? this.getUpsertQueries(entityMeta, updateEntries, visitor) : this.getUpdateQueries(entityMeta, updateEntries, visitor));
        });

        // generate add relation here.
        orderedRelationAdd.each(([relMetaData, addEntries]) => {
            // filter out add relation that has been set at insert query.
            // NOTE: this only required for relation db.
            const entries = addEntries.where(o => !(o.slaveRelation.relationType === "one" && o.slaveEntry.state === EntityState.Added));
            relationAddQueries.set(relMetaData, this.getRelationAddQueries(relMetaData, entries, visitor));
        });

        // generate remove relation here.
        orderedRelationDelete.each(([relMetaData, deleteEntries]) => {
            // if it relation entity is not yet persisted/tracked, then this relation not valid, so skip
            const entries = deleteEntries.where(o => o.masterEntry.state !== EntityState.Detached && o.slaveEntry.state !== EntityState.Detached);
            relationDeleteQueries.set(relMetaData, this.getRelationDeleteQueries(relMetaData, entries));
        });

        // Before delete even and generate query
        let deleteMode: DeleteMode;
        if (options && options.forceHardDelete)
            deleteMode = "hard";

        orderedEntityDelete.each(([entityMeta, deleteEntries]) => {
            const eventEmitter = new DBEventEmitter(this, entityMeta);
            const deleteParam: IDeleteEventParam = {
                type: deleteMode ? deleteMode : entityMeta.deletedColumn ? "soft" : "hard"
            };
            for (const entry of deleteEntries) {
                eventEmitter.emitBeforeDeleteEvent(entry.entity, deleteParam);
            }
            deleteQueries.set(entityMeta, this.getDeleteQueries(entityMeta, deleteEntries, visitor, deleteMode));
        });

        const identityInsertQueries = insertQueries.asEnumerable().where(o => o[0].hasIncrementPrimary);
        const nonIdentityInsertQueries = insertQueries.asEnumerable().where(o => !o[0].hasIncrementPrimary);

        // execute all in transaction;
        await this.transaction(async () => {
            const allQueries = identityInsertQueries.union(nonIdentityInsertQueries, true).union(relationAddQueries.asEnumerable().select(o => [o[0].source, o[1]] as [IEntityMetaData, DeferredQuery[]]), true);
            allQueries.enableCache = true;
            // execute all identity insert queries
            let i = 0;
            for (const [entityMeta, queries] of identityInsertQueries) {
                await this.executeDeferred(queries);

                i++;
                const values = queries.selectMany(o => o.value.rows).toArray();
                const transformer = new ExpressionExecutor(values);
                allQueries.skip(i).selectMany(o => o[1]).each(dQ => {
                    dQ.parameters.where(p => p.name === entityMeta.name).each(p => {
                        p.value = transformer.execute(p.paramExp.valueExp);
                    });
                });
            }

            const queries = nonIdentityInsertQueries.selectMany(o => o[1])
                .union(updateQueries.asEnumerable().selectMany(o => o[1]), true)
                .union(relationAddQueries.asEnumerable().selectMany(o => o[1]), true)
                .union(relationDeleteQueries.asEnumerable().selectMany(o => o[1]), true)
                .union(deleteQueries.asEnumerable().selectMany(o => o[1]), true);

            await this.executeDeferred(queries);

            // update all generated value from database. ex: identity, default, etc...
            for (const [entityMeta, queries] of insertQueries) {
                const eventEmitter = new DBEventEmitter(this, entityMeta);
                const insertedData = queries.selectMany(o => o.value.rows)[Symbol.iterator]();
                const entityEntries = orderedEntityAdd.first(o => o[0] === entityMeta)[1];
                for (const entityEntry of entityEntries) {
                    const data = insertedData.next().value as T;
                    for (const prop in data) {
                        const column = entityMeta.columns.first(o => o.columnName === prop);
                        if (column) entityEntry.entity[prop] = this.queryBuilder.toPropertyValue(data[prop], column);
                    }
                    entityEntry.acceptChanges();
                    eventEmitter.emitAfterSaveEvent(entityEntry.entity, { type: "insert" });
                }
            }

            // update all relation changes
            // Note: toArray coz acceptChanges will modify source array.
            const savedRelations = orderedRelationAdd.union(orderedRelationDelete).selectMany(o => o[1])
                .where(o => o.masterEntry.state !== EntityState.Detached && o.slaveEntry.state !== EntityState.Detached)
                .toArray();
            for (const relEntry of savedRelations) {
                relEntry.acceptChanges();
            }

            // accept update changes.
            updateQueries.asEnumerable().each(([entityMeta, queries]) => {
                const eventEmitter = new DBEventEmitter(this, entityMeta);
                const dbSet = this.set(entityMeta.type);
                const updateData = queries.selectMany(o => o.value.rows).toMap(o => dbSet.getMapKey(o), o => o);
                const entityEntries = orderedEntityUpdate.first(o => o[0] === entityMeta)[1];
                for (const entityEntry of entityEntries) {
                    const data = updateData.get(entityEntry.key);
                    if (data) {
                        for (const prop in data) {
                            const column = entityMeta.columns.first(o => o.columnName === prop);
                            if (column) entityEntry.entity[prop] = this.queryBuilder.toPropertyValue(data[prop], column);
                        }
                    }
                    entityEntry.acceptChanges();
                    eventEmitter.emitAfterSaveEvent(entityEntry.entity, { type: "update" });
                }
            });

            // accept delete changes.
            deleteQueries.asEnumerable().each(([entityMeta]) => {
                const eventEmitter = new DBEventEmitter(this, entityMeta);
                const entityEntries = orderedEntityDelete.first(o => o[0] === entityMeta)[1];
                const deleteParam: IDeleteEventParam = {
                    type: deleteMode ? deleteMode : entityMeta.deletedColumn ? "soft" : "hard"
                };
                for (const entry of entityEntries) {
                    entry.acceptChanges();
                    eventEmitter.emitAfterDeleteEvent(entry.entity, deleteParam);
                }
            });
        });

        const allQueries = insertQueries.asEnumerable().selectMany(o => o[1])
            .union(updateQueries.asEnumerable().selectMany(o => o[1]), true)
            .union(relationAddQueries.asEnumerable().selectMany(o => o[1]), true)
            .union(relationDeleteQueries.asEnumerable().selectMany(o => o[1]), true)
            .union(deleteQueries.asEnumerable().selectMany(o => o[1]), true);

        return allQueries.sum(o => o.value.effectedRows);
    }
    protected getUpdateQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: IQueryVisitor, option?: IQueryOption): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = Enumerable.from(entries);
        const results: DeferredQuery<IQueryResult>[] = [];
        if (!entryEnumerable.any()) return results;

        if (!visitor) visitor = this.queryVisitor;

        const entityExp = new EntityExpression(entityMetaData.type, visitor.newAlias());

        const autoUpdateColumns = entityMetaData.updateGeneratedColumns.asEnumerable();
        const hasUpdateColumn = autoUpdateColumns.any();
        let selectExp: SelectExpression<T>;
        let selectParameters: IQueryParameter[];
        if (hasUpdateColumn) {
            selectExp = new SelectExpression(entityExp);
            selectExp.selects = entityMetaData.primaryKeys.union(autoUpdateColumns).select(o => entityExp.columns.first(c => c.propertyName === o.propertyName)).toArray();
            selectParameters = [];
        }

        for (const entry of entryEnumerable) {
            const updateExp = new UpdateExpression(entityExp, {});
            let queryParameters: IQueryParameter[] = [];

            let pkFilter: IExpression<boolean>;
            for (const colExp of updateExp.entity.primaryColumns) {
                const parameter = new SqlParameterExpression(new ParameterExpression("", colExp.type), colExp.columnMetaData);
                const sqlParam: IQueryParameter = {
                    paramExp: parameter,
                    value: entry.entity[colExp.propertyName as keyof T]
                };
                queryParameters.push(sqlParam);
                if (hasUpdateColumn) {
                    selectParameters.push(sqlParam);
                }

                const compExp = new StrictEqualExpression(colExp, parameter);
                pkFilter = pkFilter ? new AndExpression(pkFilter, compExp) : compExp;
            }

            updateExp.addWhere(pkFilter);
            updateItemExp(updateExp, entry, queryParameters);
            if (hasUpdateColumn) {
                selectExp.where = selectExp.where ? new OrExpression(selectExp.where, pkFilter) : pkFilter;
            }

            const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (results) => {
                const effectedRows = results.sum(o => o.effectedRows);
                if (entityMetaData.concurrencyMode !== "NONE" && effectedRows <= 0) {
                    throw new Error("Concurrency Error");
                }
                return {
                    effectedRows: effectedRows,
                    rows: []
                };
            }, option);
            results.push(updateQuery);
        }

        // get changes done by server.
        if (hasUpdateColumn) {
            const selectQuery = new DeferredQuery(this, selectExp, selectParameters, (results) => {
                return {
                    effectedRows: 0,
                    rows: results.selectMany(o => o.rows)
                };
            }, option);
            results.push(selectQuery);
        }

        return results;
    }
    protected getDeleteQueries<T>(entityMeta: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: IQueryVisitor, deleteMode?: DeleteMode, option?: IQueryOption): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = Enumerable.from(entries);
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (entryEnumerable.count() <= 0)
            return results;

        if (!visitor) visitor = this.queryVisitor;

        const entityExp = new EntityExpression(entityMeta.type, visitor.newAlias());
        const deleteExp = new DeleteExpression(entityExp);
        if (deleteMode) deleteExp.deleteMode = new ValueExpression(deleteMode);

        const queryParameters: IQueryParameter[] = [];
        const hasCompositeKeys = entityMeta.primaryKeys.length > 1;
        let whereExp: IExpression<boolean>;

        if (hasCompositeKeys) {
            for (const entry of entryEnumerable) {
                let primaryExp: IExpression<boolean>;
                for (const col of entityExp.primaryColumns) {
                    const parameter = new SqlParameterExpression(new ParameterExpression("", col.type), col.columnMetaData);
                    queryParameters.push({
                        paramExp: parameter,
                        value: entry.entity[col.propertyName]
                    });

                    const logicalExp = new StrictEqualExpression(col, parameter);
                    primaryExp = primaryExp ? new AndExpression(primaryExp, logicalExp) : logicalExp;
                }
                whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
            }
        }
        else {
            const arrayValue = new ArrayValueExpression();
            const primaryKey = entityExp.primaryColumns.first();
            for (const entry of entryEnumerable) {
                const parameter = new SqlParameterExpression(new ParameterExpression("", primaryKey.type), primaryKey.columnMetaData);
                queryParameters.push({
                    paramExp: parameter,
                    value: entry.entity[primaryKey.propertyName]
                });
                arrayValue.items.push(parameter);
            }
            whereExp = new MethodCallExpression(arrayValue, "contains", entityExp.primaryColumns);
        }

        if (whereExp) {
            deleteExp.addWhere(whereExp);
            deleteExp.paramExps = queryParameters.select(o => o.paramExp).toArray();
            const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (results) => {
                return {
                    effectedRows: results.sum(o => o.effectedRows),
                    rows: []
                };
            }, option);
            results.push(deleteQuery);
        }
        return results;
    }
    protected getInsertQueries<T>(entityMeta: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: IQueryVisitor, option?: IQueryOption): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = Enumerable.from(entries);
        const results: DeferredQuery<IQueryResult>[] = [];
        if (!entryEnumerable.any()) return results;

        if (!visitor) visitor = this.queryVisitor;
        const entityExp = new EntityExpression<T>(entityMeta.type, visitor.newAlias());
        const relations = entityMeta.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        let columns = relations.selectMany(o => o.relationColumns)
            .union(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns).distinct();

        let generatedColumns = entityMeta.insertGeneratedColumns.union(entityMeta.columns.where(o => !!o.default));
        const hasGeneratedColumn = generatedColumns.any();
        if (hasGeneratedColumn) {
            generatedColumns = entityMeta.primaryKeys.union(generatedColumns);
        }

        if (entityMeta.hasIncrementPrimary) {
            const queryBuilder = this.queryBuilder;
            // if primary key is auto increment, then need to split all query per entry.
            const incrementColumn = entityMeta.primaryKeys.first(o => (o as any as IntegerColumnMetaData).autoIncrement);
            for (const entry of entryEnumerable) {
                const insertExp = new InsertExpression(entityExp, []);
                const queryParameters: IQueryParameter[] = [];
                insertEntryExp(insertExp, entry, columns, relations, queryParameters);

                const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }, option);
                results.push(insertQuery);

                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = generatedColumns.select(c => entityExp.columns.first(e => e.propertyName === c.propertyName)).toArray();

                const lastId = queryBuilder.lastInsertIdQuery;
                selectExp.addWhere(new StrictEqualExpression(entityExp.columns.first(c => c.propertyName === incrementColumn.columnName), new RawSqlExpression(incrementColumn.type, lastId)));

                const selectQuery = new DeferredQuery(this, selectExp, [], (results) => {
                    return {
                        effectedRows: 0,
                        rows: results.selectMany(o => o.rows)
                    };
                }, option);
                results.push(selectQuery);
            }
        }
        else {
            const insertExp = new InsertExpression<T>(entityExp, []);
            const queryParameters: IQueryParameter[] = [];

            let isCompositePrimaryKey: boolean;
            let primaryKey: IColumnExpression<T>;
            let whereExp: IExpression<boolean>;
            let arrayValue: ArrayValueExpression;
            if (hasGeneratedColumn) {
                arrayValue = new ArrayValueExpression();
                isCompositePrimaryKey = entityMeta.primaryKeys.length > 1;
                if (!isCompositePrimaryKey) {
                    primaryKey = entityExp.primaryColumns.first();
                }
            }

            for (const entry of entryEnumerable) {
                const itemExp = insertEntryExp(insertExp, entry, columns, relations, queryParameters);

                if (hasGeneratedColumn) {
                    if (isCompositePrimaryKey) {
                        let primaryExp: IExpression<boolean>;
                        for (const col of insertExp.entity.primaryColumns) {
                            const logicalExp = new StrictEqualExpression(col, itemExp[col.propertyName]);
                            primaryExp = primaryExp ? new AndExpression(primaryExp, logicalExp) : logicalExp;
                        }
                        whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
                    }
                    else {
                        arrayValue.items.push(itemExp[primaryKey.propertyName]);
                    }
                }
            }

            const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (results) => {
                return {
                    effectedRows: results.sum(o => o.effectedRows),
                    rows: []
                };
            }, option);
            results.push(insertQuery);

            if (hasGeneratedColumn) {
                if (!isCompositePrimaryKey) {
                    whereExp = new MethodCallExpression(arrayValue, "contains", [primaryKey]);
                }

                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = generatedColumns.select(c => entityExp.columns.first(e => e.propertyName === c.propertyName)).toArray();
                selectExp.addWhere(whereExp);

                results.push(new DeferredQuery(this, selectExp, [], (results) => {
                    return {
                        effectedRows: 0,
                        rows: results.selectMany(o => o.rows)
                    };
                }, option));
            }
        }

        return results;
    }
    protected getUpsertQueries<T>(entityMeta: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: IQueryVisitor, param?: IQueryOption): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = Enumerable.from(entries);
        const results: DeferredQuery<IQueryResult>[] = [];
        if (!entryEnumerable.any()) return results;

        if (!visitor) visitor = this.queryVisitor;
        const entityExp = new EntityExpression<T>(entityMeta.type, visitor.newAlias());
        const relations = entityMeta.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        let columns = relations.selectMany(o => o.relationColumns)
            .union(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns).distinct();

        let generatedColumns = entityMeta.insertGeneratedColumns.union(entityMeta.updateGeneratedColumns);
        const hasGeneratedColumn = generatedColumns.any();
        if (hasGeneratedColumn) {
            generatedColumns = entityMeta.primaryKeys.union(generatedColumns);
        }

        let isCompositePrimaryKey: boolean;
        let primaryKey: IColumnExpression<T>;
        let whereExp: IExpression<boolean>;
        let arrayValue: ArrayValueExpression;
        if (hasGeneratedColumn) {
            arrayValue = new ArrayValueExpression();
            isCompositePrimaryKey = entityMeta.primaryKeys.length > 1;
            if (!isCompositePrimaryKey) {
                primaryKey = entityExp.primaryColumns.first();
            }
        }

        for (const entry of entryEnumerable) {
            const upsertExp = new UpsertExpression(entityExp, {});
            upsertExp.updateColumns = entry.state === EntityState.Added ? entityExp.columns.where(o => !o.isPrimary).toArray() : entityExp.columns.where(o => !o.isPrimary && entry.isPropertyModified(o.propertyName)).toArray();

            const queryParameters: IQueryParameter[] = [];
            upsertEntryExp(upsertExp, entry, columns, relations, queryParameters);

            const upsertQuery = new DeferredQuery(this, upsertExp, queryParameters, (results) => {
                return {
                    effectedRows: results.max(o => o.effectedRows),
                    rows: []
                };
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
                whereExp = new MethodCallExpression(arrayValue, "contains", [primaryKey]);
            }

            const selectExp = new SelectExpression(entityExp);
            selectExp.selects = generatedColumns.select(c => entityExp.columns.first(e => e.propertyName === c.propertyName)).toArray();
            selectExp.addWhere(whereExp);

            results.push(new DeferredQuery(this, selectExp, results.selectMany(o => o.parameters).toArray(), (results) => {
                return {
                    effectedRows: 0,
                    rows: results.selectMany(o => o.rows)
                };
            }, param));
        }

        return results;
    }
    protected getRelationAddQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: Iterable<RelationEntry<T, T2, TData>>, visitor?: IQueryVisitor, param?: IQueryOption): DeferredQuery<IQueryResult>[] {
        const results: DeferredQuery<IQueryResult>[] = [];
        const relationEntryEnumerable = Enumerable.from(relationEntries);
        if (!relationEntryEnumerable.any()) return results;

        if (!visitor) visitor = this.queryVisitor;
        const slaveEntityMeta = slaveRelationMetaData.source;
        const masterEntityMeta = slaveRelationMetaData.target;
        const relationDataMeta = slaveRelationMetaData.relationData;
        const entityExp = new EntityExpression(slaveEntityMeta.type, visitor.newAlias());

        const isToOneRelation = slaveRelationMetaData.relationType === "one";
        for (const relationEntry of relationEntryEnumerable) {
            let dbContext: DbContext = null;
            const masterEntry = relationEntry.masterEntry;
            const slaveEntry = relationEntry.slaveEntry;
            const isMasterAdded = masterEntry.state === EntityState.Added;

            if (isToOneRelation) {
                let queryParameters: IQueryParameter[] = [];
                const updateExp = new UpdateExpression(entityExp, {});

                for (const relCol of slaveRelationMetaData.relationColumns) {
                    let param = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    if (isMasterAdded && (relCol.generation & ColumnGeneration.Insert)) {
                        if (!dbContext) dbContext = masterEntry.dbSet.dbContext;
                        const index = dbContext.entityEntries.add.get(masterEntityMeta).indexOf(masterEntry);
                        param = new SqlParameterExpression(new MemberAccessExpression(new ParameterExpression(index.toString(), masterEntityMeta.type), relCol.columnName as keyof T2), relCol);
                        const paramv: IQueryParameter = {
                            name: masterEntityMeta.name,
                            paramExp: param
                        };
                        queryParameters.push(paramv);
                    }
                    else {
                        const reverseProperty = slaveRelationMetaData.relationMaps.get(relCol).propertyName;
                        const paramv: IQueryParameter = {
                            paramExp: param,
                            value: masterEntry.entity[reverseProperty as keyof T2]
                        };
                        queryParameters.push(paramv);
                    }
                    updateExp.setter[relCol.propertyName] = param;
                }

                for (const col of entityExp.primaryColumns) {
                    const paramExp = getEntryColumnParam(slaveEntry, col, queryParameters);
                    updateExp.addWhere(new StrictEqualExpression(col, paramExp));
                }

                updateExp.paramExps = queryParameters.select(o => o.paramExp).toArray();
                const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }, param);
                results.push(updateQuery);
            }
            else {
                const isSlaveAdded = slaveEntry.state === EntityState.Added;
                const insertExp = new InsertExpression(new EntityExpression(relationDataMeta.type, visitor.newAlias()), []);
                const queryParameters: IQueryParameter[] = [];

                const itemExp: { [key: string]: IExpression } = {};
                for (const relCol of relationDataMeta.sourceRelationColumns) {
                    const masterCol = relationDataMeta.sourceRelationMaps.get(relCol) as IColumnMetaData<T2>;
                    let param = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    if (isMasterAdded && (masterCol.generation & ColumnGeneration.Insert)) {
                        if (!dbContext) dbContext = masterEntry.dbSet.dbContext;
                        const index = dbContext.entityEntries.add.get(masterEntityMeta).indexOf(masterEntry);
                        const masterLookupParamExp = new ParameterExpression(index.toString(), masterEntityMeta.type);
                        param = new SqlParameterExpression(new MemberAccessExpression(masterLookupParamExp, masterCol.columnName as any), relCol);
                        const paramv: IQueryParameter = {
                            name: masterEntityMeta.name,
                            paramExp: param
                        };
                        queryParameters.push(paramv);
                    }
                    else {
                        const paramv: IQueryParameter = {
                            paramExp: param,
                            value: masterEntry.entity[masterCol.propertyName]
                        };
                        queryParameters.push(paramv);
                    }
                    itemExp[relCol.propertyName] = param;
                }

                for (const relCol of relationDataMeta.targetRelationColumns.except(relationDataMeta.sourceRelationColumns)) {
                    const slaveCol = relationDataMeta.targetRelationMaps.get(relCol) as IColumnMetaData<T>;
                    let param = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    if (isSlaveAdded && (slaveCol.generation & ColumnGeneration.Insert)) {
                        if (!dbContext) dbContext = slaveEntry.dbSet.dbContext;
                        const index = dbContext.entityEntries.add.get(slaveEntityMeta).indexOf(slaveEntry);
                        param = new SqlParameterExpression(new MemberAccessExpression(new ParameterExpression(index.toString(), slaveEntityMeta.type), slaveCol.columnName as any), relCol);
                        const paramv: IQueryParameter = {
                            name: slaveEntityMeta.name,
                            paramExp: param
                        };
                        queryParameters.push(paramv);
                    }
                    else {
                        const paramv: IQueryParameter = {
                            paramExp: param,
                            value: slaveEntry.entity[slaveCol.propertyName]
                        };
                        queryParameters.push(paramv);
                    }
                    itemExp[relCol.propertyName] = param;
                }

                insertExp.values.push(itemExp);
                insertExp.paramExps = queryParameters.select(o => o.paramExp).toArray();
                const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (results) => {
                    return {
                        effectedRows: 0,
                        rows: results.selectMany(o => o.rows)
                    };
                }, param);
                results.push(insertQuery);
            }
        }

        return results;
    }
    protected getRelationDeleteQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: Iterable<RelationEntry<T, T2, TData>>, visitor?: IQueryVisitor, param?: IQueryOption): DeferredQuery<IQueryResult>[] {
        const results: DeferredQuery<IQueryResult>[] = [];
        let relationEntryEnumerable = Enumerable.from(relationEntries);
        if (!relationEntryEnumerable.any())
            return results;

        if (!visitor) visitor = this.queryVisitor;
        const isManyToMany = slaveRelationMetaData.relationType === "many";
        const relationDataMeta = slaveRelationMetaData.relationData;

        if (!isManyToMany) {
            // only process relation with not deleted slave entity.
            relationEntryEnumerable = relationEntryEnumerable.where(o => o.slaveEntry.state !== EntityState.Deleted);

            const slaveMetadata = slaveRelationMetaData.source;
            const slaveEntity = new EntityExpression(slaveMetadata.type, visitor.newAlias());
            const slaveSelect = new SelectExpression(slaveEntity);

            const queryParameters: IQueryParameter[] = [];
            const slaveHasCompositeKeys = slaveMetadata.primaryKeys.length > 1;
            let whereExp: IExpression<boolean>;
            if (!slaveHasCompositeKeys) {
                const arrayExp = new ArrayValueExpression();
                const primaryCol = slaveEntity.primaryColumns.first();
                for (const entry of relationEntryEnumerable) {
                    const paramExp = getEntryColumnParam(entry.slaveEntry, primaryCol, queryParameters);
                    arrayExp.items.push(paramExp);
                }
                whereExp = new MethodCallExpression(arrayExp, "contains", slaveEntity.primaryColumns);
            }
            else {
                for (const entry of relationEntryEnumerable) {
                    let primaryExp: IExpression<boolean>;
                    for (const col of slaveEntity.primaryColumns) {
                        const paramExp = getEntryColumnParam(entry.slaveEntry, col, queryParameters);
                        const logicalExp = new StrictEqualExpression(col, paramExp);
                        primaryExp = primaryExp ? new AndExpression(primaryExp, logicalExp) : logicalExp;
                    }
                    whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
                }
            }
            slaveSelect.addWhere(whereExp);

            // delete relation data if exist.
            if (relationDataMeta) {
                const dataEntityExp = new EntityExpression<TData>(relationDataMeta.type, relationDataMeta.name, true);
                const dataDeleteExp = new DeleteExpression(dataEntityExp, new ValueExpression<DeleteMode>("hard"));

                let relations: IExpression<boolean>;
                for (const [relColMeta, slaveColMeta] of relationDataMeta.sourceRelationMaps) {
                    const relationCol = dataDeleteExp.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = slaveSelect.entity.columns.first((o) => o.propertyName === slaveColMeta.propertyName);
                    const logicalExp = new StrictEqualExpression(relationCol, childCol);
                    relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
                }
                dataDeleteExp.addJoin(slaveSelect, relations, "INNER");

                dataDeleteExp.paramExps = queryParameters.select(o => o.paramExp).toArray();
                const dataDeleteQuery = new DeferredQuery(this, dataDeleteExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }, param);
                results.push(dataDeleteQuery);
            }

            if (slaveRelationMetaData.nullable) {
                // set foreignkey to null query.
                const setter: { [key in keyof T]?: IExpression<T[key]> } = {};
                for (const relCol of slaveRelationMetaData.relationColumns) {
                    setter[relCol.propertyName] = new ValueExpression(null);
                }
                const updateExp = new UpdateExpression(slaveSelect, setter);
                updateExp.paramExps = queryParameters.select(o => o.paramExp).toArray();
                const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }, param);
                results.push(updateQuery);
            }
            else {
                // delete slave entity
                const deleteExp = new DeleteExpression(slaveSelect);
                deleteExp.paramExps = queryParameters.select(o => o.paramExp).toArray();
                const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }, param);
                results.push(deleteQuery);
            }
        }
        else {
            // remove relation table.
            // after save remove all reference to this relation entry.
            const dataEntityExp = new EntityExpression<TData>(relationDataMeta.type, relationDataMeta.name, true);
            const queryParameters: IQueryParameter[] = [];
            let whereExp: IExpression<boolean>;
            for (const relEntry of relationEntryEnumerable) {
                let primaryExp: IExpression<boolean>;
                for (const [relCol, masterCol] of relationDataMeta.sourceRelationMaps) {
                    const relColExp = dataEntityExp.columns.first(o => o.propertyName === relCol.propertyName);
                    let param = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    const paramv: IQueryParameter = {
                        paramExp: param,
                        value: relEntry.masterEntry.entity[masterCol.propertyName as keyof T2]
                    };
                    queryParameters.push(paramv);
                    const logicalExp = new AndExpression(relColExp, param);
                    primaryExp = primaryExp ? new AndExpression(logicalExp, primaryExp) : logicalExp;
                }

                for (const [relCol, slaveCol] of relationDataMeta.targetRelationMaps) {
                    if (relationDataMeta.sourceRelationColumns.contains(relCol))
                        continue;

                    const relColExp = dataEntityExp.columns.first(o => o.propertyName === relCol.propertyName);
                    let paramExp = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    const paramv: IQueryParameter = {
                        paramExp: paramExp,
                        value: relEntry.slaveEntry.entity[slaveCol.propertyName as keyof T]
                    };
                    queryParameters.push(paramv);
                    const logicalExp = new AndExpression(relColExp, paramExp);
                    primaryExp = primaryExp ? new AndExpression(logicalExp, primaryExp) : logicalExp;
                }
                whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
            }

            const deleteExp = new DeleteExpression(dataEntityExp, new ValueExpression<DeleteMode>("hard"));
            deleteExp.addWhere(whereExp);
            deleteExp.paramExps = queryParameters.select(o => o.paramExp).toArray();
            const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (results) => {
                return {
                    effectedRows: results.sum(o => o.effectedRows),
                    rows: []
                };
            }, param);
            results.push(deleteQuery);
        }

        return results;
    }
    //#endregion
}

const getEntryColumnParam = <T>(entry: EntityEntry<T>, colExp: IColumnExpression<T>, queryParameters: IQueryParameter[]) => {
    let paramExp = new SqlParameterExpression(new ParameterExpression("", colExp.type), colExp.columnMetaData);
    queryParameters.push({
        paramExp: paramExp,
        value: entry.entity[colExp.propertyName]
    });
    return paramExp;
};