import "../Extensions/ArrayItemTypeExtension";
import { IObjectType, GenericType, DbType, IsolationLevel, QueryType, DeleteMode, JoinType, ColumnGeneration } from "../Common/Type";
import { DbSet } from "./DbSet";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { IQueryResultParser } from "../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryCacheManager } from "../Cache/IQueryCacheManager";
import { DefaultQueryCacheManager } from "../Cache/DefaultQueryCacheManager";
import { IQueryResult } from "../QueryBuilder/IQueryResult";
import { IDBEventListener } from "./Event/IDBEventListener";
import { IDriver } from "../Connection/IDriver";
import { IQuery } from "../QueryBuilder/Interface/IQuery";
import { DBEventEmitter } from "./Event/DbEventEmitter";
import { EntityState } from "./EntityState";
import { EntityEntry } from "./EntityEntry";
import { DeferredQuery } from "../QueryBuilder/DeferredQuery";
import { SchemaBuilder } from "../QueryBuilder/SchemaBuilder";
import { RelationEntry } from "./RelationEntry";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";
import { isValue } from "../Helper/Util";
import { ISaveChangesOption } from "../QueryBuilder/Interface/IQueryOption";
import { IConnectionManager } from "../Connection/IConnectionManager";
import { DefaultConnectionManager } from "../Connection/DefaultConnectionManager";
import { IConnection } from "../Connection/IConnection";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IDeleteEventParam } from "../MetaData/Interface/IDeleteEventParam";
import { IntegerColumnMetaData } from "../MetaData/IntegerColumnMetaData";
import { ISaveEventParam } from "../MetaData/Interface/ISaveEventParam";
import { QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { Enumerable } from "../Enumerable/Enumerable";
import { IQueryCommandExpression } from "../Queryable/QueryExpression/IQueryCommandExpression";
import { ISqlParameter } from "../QueryBuilder/ISqlParameter";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";
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
import { ValueExpressionTransformer } from "../ExpressionBuilder/ValueExpressionTransformer";
import { NamingStrategy } from "../QueryBuilder/NamingStrategy";
import { QueryTranslator } from "../QueryBuilder/QueryTranslator/QueryTranslator";
import { Diagnostic } from "../Logger/Diagnostic";
import { IResultCacheManager } from "../Cache/IResultCacheManager";
import { UpsertExpression, upsertEntryExp } from "../Queryable/QueryExpression/UpsertExpression";
import { DbFunction } from "../QueryBuilder/DbFunction";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";

export type IChangeEntryMap<T extends string, TKey, TValue> = { [K in T]: Map<TKey, TValue[]> };
const connectionManagerKey = Symbol("connectionManagerKey");
const queryCacheManagerKey = Symbol("queryCacheManagerKey");

export abstract class DbContext<T extends DbType = any> implements IDBEventListener<any> {
    public abstract readonly entityTypes: Array<IObjectType<any>>;
    protected abstract readonly queryBuilderType: IObjectType<QueryBuilder>;
    protected abstract readonly queryVisitorType: IObjectType<QueryVisitor>;
    protected abstract readonly schemaBuilderType: IObjectType<SchemaBuilder>;
    protected abstract readonly queryResultParserType: IObjectType<IQueryResultParser>;
    protected abstract readonly namingStrategy: NamingStrategy;
    protected abstract readonly translator: QueryTranslator;
    public abstract readonly dbType: T;
    protected readonly queryCacheManagerType?: IObjectType<IQueryCacheManager>;
    public get queryBuilder(): QueryBuilder {
        return new this.queryBuilderType(this.namingStrategy, this.translator);
    }
    public get queryVisitor(): QueryVisitor {
        return new this.queryVisitorType(this.namingStrategy, this.translator);
    }
    public getQueryResultParser(command: IQueryCommandExpression, queryBuilder: QueryBuilder): IQueryResultParser {
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
    protected get connectionManager() {
        if (!this._connectionManager) {
            this._connectionManager = Reflect.getOwnMetadata(connectionManagerKey, this.constructor);
            if (!this._connectionManager) {
                const val = this.factory();
                if ((val as IConnectionManager).getAllServerConnections) {
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
        if (!con.isOpen)
            await con.open();
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
    protected cachedDbSets: Map<IObjectType, DbSet<any>> = new Map();
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
        let result: DbSet<T> = isClearCache ? undefined as any : this.cachedDbSets.get(type);
        if (!result && this.entityTypes.contains(type)) {
            result = new DbSet(type, this);
            this.cachedDbSets.set(type, result);
        }
        return result;
    }
    public attach<T>(entity: T) {
        const set = this.set<T>(entity.constructor as any);
        if (set) {
            return set.attach(entity);
        }
        return undefined;
    }
    public entry<T>(entity: T) {
        const set = this.set<T>(entity.constructor as any);
        if (set) {
            return set.entry(entity);
        }
        return undefined;
    }
    public add<T>(entity: T) {
        const entry = this.attach(entity);
        if (entry) {
            this.changeState(entry, EntityState.Added);
        }
        return entry;
    }
    public delete<T>(entity: T) {
        const entry = this.attach(entity);
        if (entry) {
            this.changeState(entry, EntityState.Deleted);
        }
        return entry;
    }
    public update<T>(entity: T, originalValues?: { [key in keyof T]: any }) {
        const entry = this.attach(entity);
        if (entry) {
            if (originalValues instanceof Object)
                entry.setOriginalValues(originalValues);
            this.changeState(entry, EntityState.Modified);
        }
        return entry;
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
            return;
        }

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
    public modifiedEmbeddedEntries: Map<IEntityMetaData<any>, Array<EmbeddedEntityEntry>> = new Map();
    public clear() {
        this.modifiedEmbeddedEntries.clear();
        this.relationEntries.add.clear();
        this.relationEntries.delete.clear();
        this.entityEntries.delete.clear();
        this.entityEntries.add.clear();
        this.entityEntries.update.clear();
        for (const [, dbSet] of this.cachedDbSets) {
            dbSet.clear();
        }
    }
    //#endregion

    public async executeQuery(command: IQuery): Promise<IQueryResult[]> {
        const con = this.connection ? this.connection : await this.getConnection(command.type !== QueryType.DQL);
        const timer = Diagnostic.timer();
        if (Diagnostic.enabled) Diagnostic.debug(con, `Execute Query.`, command);
        const result = await con.executeQuery(command);
        if (Diagnostic.enabled) {
            Diagnostic.debug(con, `Query Result.`, result);
            Diagnostic.trace(con, `Execute Query time: ${timer.time()}ms`);
        }
        if (!this.connection)
            await this.closeConnection(con);
        return result;
    }
    public async executeQueries(queryCommands: IQuery[]): Promise<IQueryResult[]> {
        let results: IQueryResult[] = [];
        const con = await this.getConnection(queryCommands.any(o => o.type !== QueryType.DQL));
        for (const query of queryCommands) {
            const res = await con.executeQuery(query);
            results = results.concat(res);
        }
        await this.closeConnection(con);
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
    public async executeDeferred(deferredQueries: Iterable<DeferredQuery>) {
        const queryBuilder = this.queryBuilder;
        let deferredQueryEnumerable = Enumerable.load(deferredQueries);

        // check cached
        if (this.resultCacheManager) {
            const cacheQueries = deferredQueryEnumerable.where(o => o.command instanceof SelectExpression && o.options.resultCache !== "none");
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
        deferredQueryEnumerable.selectMany(o => o.parameters).where(o => !o.parameter.select).groupBy(o => o.value)
            .each(o => {
                const alias = paramPrefix + i++;
                o.each(p => {
                    p.name = alias;
                    if (p.parameter.column)
                        p.value = queryBuilder.toParameterValue(p.value, p.parameter.column);
                });
            });

        const mergedQueries = queryBuilder.mergeQueryCommands(deferredQueryEnumerable.selectMany(o => {
            return o.buildQuery(queryBuilder);
        }));
        let queryResult: IQueryResult[] = [];
        this.connection = await this.getConnection(mergedQueries.any(o => o.type !== QueryType.DQL));
        for (const command of mergedQueries) {
            const result = await this.executeQuery(command);
            queryResult = queryResult.concat(result);
        }
        this.closeConnection();
        for (const deferredQuery of deferredQueryEnumerable) {
            const results = queryResult.splice(0, deferredQuery.queries.length);
            deferredQuery.resolve(results);

            // cache result
            if (this.resultCacheManager) {
                if (deferredQuery.command instanceof SelectExpression) {
                    const option = deferredQuery.options;
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
        const commands = this.queryBuilder.mergeQueryCommands(schemaQuery.commit);

        // must be executed to all connection in case connection manager handle replication
        const serverConnections = await this.connectionManager.getAllServerConnections();
        for (const serverConnection of serverConnections) {
            this.connection = serverConnection;
            await this.transaction(async () => {
                await this.executeQueries(commands);
            });
        }
    }
    public async getUpdateSchemaQueries(entityTypes: IObjectType[]) {
        const con = await this.getConnection();
        const schemaBuilder = new this.schemaBuilderType(con, this.queryBuilder);
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
        const command: IQueryCommandExpression = {
            parameters: [],
            type: type as any,
            clone: () => command,
            execute: () => null,
            buildParameter: () => [],
            toQueryCommands: () => ([{
                query: rawQuery,
                parameters: parameters,
                type: QueryType.DQL
            }]),
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
        }).toArray());
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
    public async saveChanges(options?: ISaveChangesOption): Promise<number> {
        const insertQueries: Map<IEntityMetaData, DeferredQuery<IQueryResult>[]> = new Map();
        const updateQueries: Map<IEntityMetaData, DeferredQuery<IQueryResult>[]> = new Map();
        const deleteQueries: Map<IEntityMetaData, DeferredQuery<IQueryResult>[]> = new Map();
        const relationDeleteQueries: Map<IRelationMetaData, DeferredQuery<IQueryResult>[]> = new Map();
        const relationAddQueries: Map<IRelationMetaData, DeferredQuery<IQueryResult>[]> = new Map();

        // order by priority
        const orderedEntityAdd = this.entityEntries.add.asEnumerable().orderBy([o => o[0].priority, "ASC"]);
        const orderedEntityUpdate = this.entityEntries.update.asEnumerable().orderBy([o => o[0].priority, "ASC"]);
        const orderedEntityDelete = this.entityEntries.delete.asEnumerable().orderBy([o => o[0].priority, "DESC"]);

        const orderedRelationAdd = this.relationEntries.add.asEnumerable().orderBy([o => o[0].source.priority, "ASC"]);
        const orderedRelationDelete = this.relationEntries.delete.asEnumerable().orderBy([o => o[0].source.priority, "DESC"]);

        const visitor = this.queryVisitor;
        visitor.options = options;

        // apply embedded entity changes
        for (const [, embeddedEntries] of this.modifiedEmbeddedEntries) {
            // TODO: decide whether event emitter required here
            for (const entry of embeddedEntries) {
                if (entry.parentEntry.state === EntityState.Unchanged)
                    entry.parentEntry.changeState(EntityState.Modified);
                continue;
            }
        }

        // Before add event and generate query
        orderedEntityAdd.each(([entityMeta, addEntries]) => {
            const eventEmitter = new DBEventEmitter(this, entityMeta);
            for (const entry of addEntries) {
                eventEmitter.emitBeforeSaveEvent(entry.entity, { type: "insert" });
            }
            const insertResult = options && options.useUpsert ? this.getUpsertQueries(entityMeta, addEntries, visitor) : this.getInsertQueries(entityMeta, addEntries, visitor);
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
            deleteMode = "Hard";

        orderedEntityDelete.each(([entityMeta, deleteEntries]) => {
            const eventEmitter = new DBEventEmitter(this, entityMeta);
            const deleteParam: IDeleteEventParam = {
                type: deleteMode ? deleteMode : !entityMeta.deletedColumn ? "Soft" : "Hard"
            };
            for (const entry of deleteEntries) {
                eventEmitter.emitBeforeDeleteEvent(entry.entity, deleteParam);
            }
            deleteQueries.set(entityMeta, this.getDeleteQueries(entityMeta, deleteEntries, visitor));
        });

        const identityInsertQueries = insertQueries.asEnumerable().where(o => o[0].hasIncrementPrimary);
        const nonIdentityInsertQueries = insertQueries.asEnumerable().where(o => !o[0].hasIncrementPrimary);

        // execute all in transaction;
        await this.transaction(async () => {
            const asdQ = identityInsertQueries.union(nonIdentityInsertQueries, true).union(relationAddQueries.asEnumerable().select(o => [o[0].source, o[1]] as [IEntityMetaData, DeferredQuery[]]), true);
            // execute all identity insert queries
            let i = 0;
            identityInsertQueries.each(async ([entityMeta, queries]) => {
                await this.executeDeferred(queries);

                const values = queries.selectMany(o => o.value.rows).toArray();
                asdQ.skip(i).selectMany(o => o[1]).each(dQ => {
                    dQ.command.parameters.where(p => p.name === entityMeta.name).each(p => {
                        let paramVal = p.execute(new ValueExpressionTransformer(values));
                        dQ.parameters.push({
                            name: "",
                            parameter: p,
                            value: paramVal
                        });
                    });
                });
                i++;
            });

            const queries = nonIdentityInsertQueries.selectMany(o => o[1])
                .union(updateQueries.asEnumerable().selectMany(o => o[1]), true)
                .union(relationAddQueries.asEnumerable().selectMany(o => o[1]), true)
                .union(relationDeleteQueries.asEnumerable().selectMany(o => o[1]), true)
                .union(deleteQueries.asEnumerable().selectMany(o => o[1]), true);

            await this.executeDeferred(queries);
        });

        // update all generated value from database. ex: identity, default, etc...
        insertQueries.asEnumerable().each(([entityMeta, queries]) => {
            const eventEmitter = new DBEventEmitter(this, entityMeta);
            const insertedData = queries.selectMany(o => o.value.rows)[Symbol.iterator]();
            const entityEntries = orderedEntityAdd.first(o => o[0] === entityMeta)[1];
            for (const entityEntry of entityEntries) {
                const data = insertedData.next().value as T;
                for (const prop in data) {
                    entityEntry.entity[prop] = data[prop];
                }
                entityEntry.acceptChanges();
                eventEmitter.emitAfterSaveEvent(entityEntry.entity, { type: "insert" });
            }
        });

        // update all relation changes
        orderedRelationAdd.union(orderedRelationDelete).selectMany(o => o[1])
            .where(o => o.masterEntry.state !== EntityState.Detached && o.slaveEntry.state !== EntityState.Detached)
            .each(o => o.acceptChanges());

        // accept update changes.
        updateQueries.asEnumerable().each(([entityMeta, queries]) => {
            const eventEmitter = new DBEventEmitter(this, entityMeta);
            const updateData = queries.selectMany(o => o.value.rows)[Symbol.iterator]();
            const entityEntries = orderedEntityAdd.first(o => o[0] === entityMeta)[1];
            for (const entityEntry of entityEntries) {
                const data = updateData.next().value as any;
                if (data) {
                    for (const prop in data) {
                        entityEntry.entity[prop] = data[prop];
                    }
                }
                entityEntry.acceptChanges();
                eventEmitter.emitAfterSaveEvent(entityEntry.entity, { type: "update" });
            }
        });

        // accept delete changes.
        deleteQueries.asEnumerable().each(([entityMeta]) => {
            const eventEmitter = new DBEventEmitter(this, entityMeta);
            const entityEntries = orderedEntityAdd.first(o => o[0] === entityMeta)[1];
            for (const entry of entityEntries) {
                entry.acceptChanges();
                eventEmitter.emitAfterDeleteEvent(entry.entity, { type: deleteMode });
            }
        });

        const allQueries = insertQueries.asEnumerable().selectMany(o => o[1])
            .union(updateQueries.asEnumerable().selectMany(o => o[1]), true)
            .union(relationAddQueries.asEnumerable().selectMany(o => o[1]), true)
            .union(relationDeleteQueries.asEnumerable().selectMany(o => o[1]), true)
            .union(deleteQueries.asEnumerable().selectMany(o => o[1]), true);

        return allQueries.sum(o => o.value.effectedRows);
    }
    protected getUpdateQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = Enumerable.load(entries);
        const results: DeferredQuery<IQueryResult>[] = [];
        if (!entryEnumerable.any()) return results;

        if (!visitor) visitor = this.queryVisitor;

        const entityExp = new EntityExpression(entityMetaData.type, visitor.newAlias());

        let autoUpdateColumns = entityMetaData.updateGeneratedColumns.asEnumerable();
        const hasUpdateColumn = autoUpdateColumns.any();
        if (hasUpdateColumn) {
            autoUpdateColumns = entityMetaData.primaryKeys.union(autoUpdateColumns);
        }

        for (const entry of entryEnumerable) {
            const updateExp = new UpdateExpression(entityExp, {});
            const queryParameters: ISqlParameter[] = [];
            updateItemExp(updateExp, entry, visitor, queryParameters);
            const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (results) => {
                const effectedRows = results.sum(o => o.effectedRows);
                if (entityMetaData.concurrencyMode !== "NONE" && effectedRows <= 0) {
                    throw new Error("Concurrency Error");
                }
                return {
                    effectedRows: effectedRows,
                    rows: []
                };
            });
            results.push(updateQuery);
        }

        // get changes done by server.
        if (hasUpdateColumn) {
            let selectParameters: ISqlParameter[] = [];
            const selectExp = new SelectExpression(entityExp);
            selectExp.selects = autoUpdateColumns.select(o => entityExp.columns.first(c => c.propertyName === o.propertyName)).toArray();

            for (const result of results) {
                const updateExp = result.command as UpdateExpression<T>;
                selectParameters = selectParameters.union(result.parameters.where(o => o.parameter.column.isPrimaryColumn)).toArray();
                selectExp.where = selectExp.where ? new OrExpression(selectExp.where, updateExp.where) : updateExp.where;
            }

            const selectQuery = new DeferredQuery(this, selectExp, selectParameters, (results) => {
                return {
                    effectedRows: 0,
                    rows: results.selectMany(o => o.rows)
                };
            });
            results.push(selectQuery);
        }

        return results;
    }
    protected getDeleteQueries<T>(entityMeta: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = Enumerable.load(entries);
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (entryEnumerable.count() <= 0)
            return results;

        if (!visitor) visitor = this.queryVisitor;
        const option = visitor.options as ISaveChangesOption;

        let deleteMode: DeleteMode = !entityMeta.deletedColumn ? "Soft" : "Hard";
        if (option && option.forceHardDelete) {
            deleteMode = "Hard";
        }

        const entityExp = new EntityExpression(entityMeta.type, visitor.newAlias());
        const deleteExp = new DeleteExpression(entityExp, new ValueExpression(deleteMode));

        const queryParameters: ISqlParameter[] = [];
        const hasCompositeKeys = entityMeta.primaryKeys.length > 1;
        let whereExp: IExpression<boolean>;

        if (hasCompositeKeys) {
            for (const entry of entryEnumerable) {
                let primaryExp: IExpression<boolean>;
                for (const col of entityExp.primaryColumns) {
                    const paramName = visitor.newAlias("param");
                    const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, col.type), col.columnMetaData);
                    queryParameters.push({
                        name: paramName,
                        parameter: parameter,
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
                const paramName = visitor.newAlias("param");
                const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, primaryKey.type), primaryKey.columnMetaData);
                queryParameters.push({
                    name: paramName,
                    parameter: parameter,
                    value: entry.entity[primaryKey.propertyName]
                });
                arrayValue.items.push(parameter);
            }
            whereExp = new MethodCallExpression(arrayValue, "contains", entityExp.primaryColumns);
        }

        if (whereExp) {
            deleteExp.addWhere(whereExp);
            const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (results) => {
                return {
                    effectedRows: results.sum(o => o.effectedRows),
                    rows: []
                };
            });
            results.push(deleteQuery);
        }
        return results;
    }
    protected getInsertQueries<T>(entityMeta: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = Enumerable.load(entries);
        const results: DeferredQuery<IQueryResult>[] = [];
        if (!entryEnumerable.any()) return results;

        if (!visitor) visitor = this.queryVisitor;
        const entityExp = new EntityExpression<T>(entityMeta.type, visitor.newAlias());
        const relations = entityMeta.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        let columns = relations.selectMany(o => o.relationColumns)
            .union(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns).distinct();

        let generatedColumns = entityMeta.insertGeneratedColumns.asEnumerable();
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
                const queryParameters: ISqlParameter[] = [];
                insertEntryExp(insertExp, entry, columns, relations, visitor, queryParameters);

                const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                });
                results.push(insertQuery);

                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = generatedColumns.select(c => entityExp.columns.first(e => e.propertyName === c.propertyName)).toArray();

                const translator = queryBuilder.resolveTranslator(DbFunction, "lastInsertedId");
                const lastId = translator ? translator.translate(null, queryBuilder) : "LAST_INSERT_ID()";
                selectExp.addWhere(new StrictEqualExpression(entityExp.columns.first(c => c.propertyName === incrementColumn.columnName), new RawSqlExpression(incrementColumn.type, lastId)));

                const selectQuery = new DeferredQuery(this, selectExp, [], (results) => {
                    return {
                        effectedRows: 0,
                        rows: results.selectMany(o => o.rows)
                    };
                });
                results.push(selectQuery);
            }
        }
        else {
            const insertExp = new InsertExpression<T>(entityExp, []);
            const queryParameters: ISqlParameter[] = [];

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
                const itemExp = insertEntryExp(insertExp, entry, columns, relations, visitor, queryParameters);

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
            });
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
                }));
            }
        }

        return results;
    }
    protected getUpsertQueries<T>(entityMeta: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        if (entityMeta.hasIncrementPrimary) {
            // if it has auto increment column then no need to use upsert.
            return this.getInsertQueries(entityMeta, entries);
        }

        let entryEnumerable = Enumerable.load(entries);
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

            const queryParameters: ISqlParameter[] = [];
            upsertEntryExp(upsertExp, entry, columns, relations, visitor, queryParameters);

            const upsertQuery = new DeferredQuery(this, upsertExp, queryParameters, (results) => {
                return {
                    effectedRows: results.max(o => o.effectedRows),
                    rows: []
                };
            });
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
            }));
        }

        return results;
    }
    protected getRelationAddQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: Iterable<RelationEntry<T, T2, TData>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        const results: DeferredQuery<IQueryResult>[] = [];
        const relationEntryEnumerable = Enumerable.load(relationEntries);
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
                let queryParameters: ISqlParameter[] = [];
                const updateExp = new UpdateExpression(entityExp, {});

                for (const relCol of slaveRelationMetaData.relationColumns) {
                    const alias = visitor.newAlias("param");
                    let param = new SqlParameterExpression(alias, new ParameterExpression(alias, relCol.type), relCol);
                    if (isMasterAdded && (relCol.generation & ColumnGeneration.Insert)) {
                        // TODO: get value from parent.
                        if (!dbContext) dbContext = masterEntry.dbSet.dbContext;
                        const index = dbContext.entityEntries.add.get(masterEntityMeta).indexOf(masterEntry);
                        param = new SqlParameterExpression(masterEntityMeta.name, new MemberAccessExpression(new ParameterExpression(index.toString(), masterEntityMeta.type), relCol.columnName), relCol);
                        updateExp.parameters.push(param);
                    }
                    else {
                        const reverseProperty = slaveRelationMetaData.relationMaps.get(relCol).propertyName;
                        const paramv: ISqlParameter = {
                            name: alias,
                            parameter: param,
                            value: masterEntry.entity[reverseProperty as keyof T2]
                        };
                        queryParameters.push(paramv);
                    }
                    updateExp.setter[relCol.propertyName] = param;
                }

                for (const col of entityExp.primaryColumns) {
                    const paramExp = getEntryColumnParam(slaveEntry, col, visitor, queryParameters);
                    updateExp.addWhere(new StrictEqualExpression(col, paramExp));
                }

                const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                });
                results.push(updateQuery);
            }
            else {
                const isSlaveAdded = slaveEntry.state === EntityState.Added;
                const insertExp = new InsertExpression(new EntityExpression(relationDataMeta.type, visitor.newAlias()), []);
                const queryParameters: ISqlParameter[] = [];

                const itemExp: { [key: string]: IExpression } = {};
                for (const relCol of relationDataMeta.sourceRelationColumns) {
                    const masterCol = relationDataMeta.sourceRelationMaps.get(relCol) as IColumnMetaData<T2>;
                    const alias = visitor.newAlias("param");
                    let param = new SqlParameterExpression(alias, new ParameterExpression(alias, relCol.type), relCol);
                    if (isMasterAdded && (masterCol.generation & ColumnGeneration.Insert)) {
                        // TODO: get value from parent.
                        if (!dbContext) dbContext = masterEntry.dbSet.dbContext;
                        const index = dbContext.entityEntries.add.get(masterEntityMeta).indexOf(masterEntry);
                        const masterLookupParamExp = new ParameterExpression(index.toString(), masterEntityMeta.type);
                        param = new SqlParameterExpression(masterEntityMeta.name, new MemberAccessExpression(masterLookupParamExp, masterCol.columnName), relCol);
                        insertExp.parameters.push(param);
                    }
                    else {
                        const paramv: ISqlParameter = {
                            name: alias,
                            parameter: param,
                            value: masterEntry.entity[masterCol.propertyName]
                        };
                        queryParameters.push(paramv);
                    }
                    itemExp[relCol.propertyName] = param;
                }

                for (const relCol of relationDataMeta.targetRelationColumns.except(relationDataMeta.sourceRelationColumns)) {
                    const slaveCol = relationDataMeta.targetRelationMaps.get(relCol) as IColumnMetaData<T>;
                    const alias = visitor.newAlias("param");
                    let param = new SqlParameterExpression(alias, new ParameterExpression(alias, relCol.type), relCol);
                    if (isSlaveAdded && (slaveCol.generation & ColumnGeneration.Insert)) {
                        // TODO: get value from parent.
                        if (!dbContext) dbContext = slaveEntry.dbSet.dbContext;
                        const index = dbContext.entityEntries.add.get(slaveEntityMeta).indexOf(slaveEntry);
                        param = new SqlParameterExpression(slaveEntityMeta.name, new MemberAccessExpression(new ParameterExpression(index.toString(), slaveEntityMeta.type), slaveCol.columnName), relCol);
                        insertExp.parameters.push(param);
                    }
                    else {
                        const paramv: ISqlParameter = {
                            name: alias,
                            parameter: param,
                            value: slaveEntry.entity[slaveCol.propertyName]
                        };
                        queryParameters.push(paramv);
                    }
                    itemExp[relCol.propertyName] = param;
                }

                insertExp.values.push(itemExp);
                const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (results) => {
                    return {
                        effectedRows: 0,
                        rows: results.selectMany(o => o.rows)
                    };
                });
                results.push(insertQuery);
            }
        }

        return results;
    }
    protected getRelationDeleteQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: Iterable<RelationEntry<T, T2, TData>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        const results: DeferredQuery<IQueryResult>[] = [];
        let relationEntryEnumerable = Enumerable.load(relationEntries);
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

            const queryParameters: ISqlParameter[] = [];
            const slaveHasCompositeKeys = slaveMetadata.primaryKeys.length > 1;
            let whereExp: IExpression<boolean>;
            if (!slaveHasCompositeKeys) {
                const arrayExp = new ArrayValueExpression();
                const primaryCol = slaveEntity.primaryColumns.first();
                for (const entry of relationEntryEnumerable) {
                    const paramExp = getEntryColumnParam(entry.slaveEntry, primaryCol, visitor, queryParameters);
                    arrayExp.items.push(paramExp);
                }
                whereExp = new MethodCallExpression(arrayExp, "contains", slaveEntity.primaryColumns);
            }
            else {
                for (const entry of relationEntryEnumerable) {
                    let primaryExp: IExpression<boolean>;
                    for (const col of slaveEntity.primaryColumns) {
                        const paramExp = getEntryColumnParam(entry.slaveEntry, col, visitor, queryParameters);
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
                const dataDeleteExp = new DeleteExpression(dataEntityExp, new ValueExpression<DeleteMode>("Hard"));

                let relations: IExpression<boolean>;
                for (const [relColMeta, slaveColMeta] of relationDataMeta.targetRelationMaps) {
                    const relationCol = dataDeleteExp.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = slaveSelect.entity.columns.first((o) => o.propertyName === slaveColMeta.propertyName);
                    const logicalExp = new StrictEqualExpression(relationCol, childCol);
                    relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
                }
                dataDeleteExp.addJoinRelation(slaveSelect, relations, JoinType.INNER);

                const dataDeleteQuery = new DeferredQuery(this, dataDeleteExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                });
                results.push(dataDeleteQuery);
            }

            if (slaveRelationMetaData.nullable) {
                // set foreignkey to null query.
                const setter: { [key in keyof T]?: IExpression } = {};
                for (const relCol of slaveRelationMetaData.relationColumns) {
                    setter[relCol.propertyName] = new ValueExpression(null);
                }
                const updateExp = new UpdateExpression(slaveSelect, setter);
                const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                });
                results.push(updateQuery);
            }
            else {
                // delete slave entity
                const deleteExp = new DeleteExpression(slaveSelect, new ValueExpression<DeleteMode>("Soft"));
                const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                });
                results.push(deleteQuery);
            }
        }
        else {
            // remove relation table.
            // after save remove all reference to this relation entry.
            const dataEntityExp = new EntityExpression<TData>(relationDataMeta.type, relationDataMeta.name, true);
            const queryParameters: ISqlParameter[] = [];
            let whereExp: IExpression<boolean>;
            for (const relEntry of relationEntryEnumerable) {
                let primaryExp: IExpression<boolean>;
                for (const [relCol, masterCol] of relationDataMeta.sourceRelationMaps) {
                    const relColExp = dataEntityExp.columns.first(o => o.propertyName === relCol.propertyName);
                    const alias = visitor.newAlias("param");
                    let param = new SqlParameterExpression(alias, new ParameterExpression(alias, relCol.type), relCol);
                    const paramv: ISqlParameter = {
                        name: alias,
                        parameter: param,
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
                    const alias = visitor.newAlias("param");
                    let paramExp = new SqlParameterExpression(alias, new ParameterExpression(alias, relCol.type), relCol);
                    const paramv: ISqlParameter = {
                        name: alias,
                        parameter: paramExp,
                        value: relEntry.slaveEntry.entity[slaveCol.propertyName as keyof T]
                    };
                    queryParameters.push(paramv);
                    const logicalExp = new AndExpression(relColExp, paramExp);
                    primaryExp = primaryExp ? new AndExpression(logicalExp, primaryExp) : logicalExp;
                }
                whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
            }

            const deleteExp = new DeleteExpression(dataEntityExp, new ValueExpression<DeleteMode>("Hard"));
            deleteExp.addWhere(whereExp);
            const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (results) => {
                return {
                    effectedRows: results.sum(o => o.effectedRows),
                    rows: []
                };
            });
            results.push(deleteQuery);
        }

        return results;
    }
    //#endregion
}

const getEntryColumnParam = <T>(entry: EntityEntry<T>, colExp: IColumnExpression<T>, visitor: QueryVisitor, queryParameters: ISqlParameter[]) => {
    const alias = visitor.newAlias("param");
    let paramExp = new SqlParameterExpression(alias, new ParameterExpression(alias, colExp.type), colExp.columnMetaData);
    queryParameters.push({
        name: alias,
        parameter: paramExp,
        value: entry.entity[colExp.propertyName]
    });
    return paramExp;
};