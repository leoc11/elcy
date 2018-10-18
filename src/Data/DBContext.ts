import "../Extensions/ArrayItemTypeExtension";
import { IObjectType, GenericType, DbType, IsolationLevel, QueryType, DeleteMode, ColumnGeneration, JoinType } from "../Common/Type";
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
import { columnMetaKey } from "../Decorator/DecoratorKey";
import { ColumnMetaData } from "../MetaData/ColumnMetaData";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";
import { UpdateExpression } from "../Queryable/QueryExpression/UpdateExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { OrExpression } from "../ExpressionBuilder/Expression/OrExpression";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { RawSqlExpression } from "../Queryable/QueryExpression/RawSqlExpression";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { ValueExpressionTransformer } from "../ExpressionBuilder/ValueExpressionTransformer";
import { NamingStrategy } from "../QueryBuilder/NamingStrategy";
import { QueryTranslator } from "../QueryBuilder/QueryTranslator/QueryTranslator";
import { Diagnostic } from "../Logger/Diagnostic";
import { IResultCacheManager } from "../Cache/IResultCacheManager";
import { UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";
import { DbFunction } from "../QueryBuilder/DbFunction";

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
        let deferredQueryEnumerable = new Enumerable(deferredQueries);

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
            const entries = addEntries.where(o => !(o.slaveRelation.relationType === "one" && o.slaveEntry.state === EntityState.Added/* && !o.slaveRelation.nullable*/));
            relationAddQueries.set(relMetaData, this.getRelationAddQueries(relMetaData, entries));
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
        let entryEnumerable = new Enumerable(entries);
        if (entryEnumerable.count() <= 0)
            return [];

        if (!visitor) visitor = this.queryVisitor;
        const option = visitor.options;

        let autoUpdateColumns = entityMetaData.updateGeneratedColumns.asEnumerable();
        if (autoUpdateColumns.any()) {
            autoUpdateColumns = entityMetaData.primaryKeys.union(autoUpdateColumns);
        }

        const entityExp = new EntityExpression(entityMetaData.type, visitor.newAlias());
        const updateSelectParameters: ISqlParameter[] = [];
        const dataSelectExp = new SelectExpression(entityExp);
        if (entityMetaData.deletedColumn && !(option && option.includeSoftDeleted)) {
            dataSelectExp.addWhere(new StrictEqualExpression(dataSelectExp.entity.deleteColumn, new ValueExpression(false)));
        }

        dataSelectExp.selects = autoUpdateColumns.select(o => entityExp.columns.first(c => c.propertyName === o.propertyName)).toArray();

        let result: DeferredQuery<IQueryResult>[] = entryEnumerable.select(entry => {
            const modifiedColumns = entry.getModifiedProperties().select(o => Reflect.getMetadata(columnMetaKey, entityMetaData.type, o) as ColumnMetaData<T>);

            const set: { [key: string]: IExpression<any> } = {};

            const queryParameters: ISqlParameter[] = [];
            modifiedColumns.each(o => {
                const paramName = visitor.newAlias("param");
                const paramExp = new SqlParameterExpression(paramName, new ParameterExpression(paramName, o.type), o);
                queryParameters.push({
                    name: paramName,
                    parameter: paramExp,
                    value: entry.entity[o.propertyName as keyof T]
                });
                set[o.columnName] = paramExp;
            });

            if (entry.metaData.modifiedDateColumn) {
                set[entry.metaData.modifiedDateColumn.columnName] = new MethodCallExpression(new ValueExpression(Date), "timestamp", [new ValueExpression(entry.metaData.modifiedDateColumn.timeZoneHandling === "utc")]);
            }

            const updateExp = new UpdateExpression(entityExp as any, set);
            if (updateExp.entity.deleteColumn && !(option && option.includeSoftDeleted)) {
                updateExp.addWhere(new StrictEqualExpression(updateExp.entity.deleteColumn, new ValueExpression(false)));
            }

            entityMetaData.primaryKeys.each(o => {
                const paramName = visitor.newAlias("param");
                const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, o.type), o);
                const sqlParam = {
                    name: paramName,
                    parameter: parameter,
                    value: entry.entity[o.propertyName]
                };
                queryParameters.push(sqlParam);

                const colExp = updateExp.entity.columns.first(c => c.propertyName === o.propertyName);
                const compExp = new StrictEqualExpression(colExp, parameter);
                updateExp.addWhere(compExp);

                if (dataSelectExp.selects.any()) {
                    updateSelectParameters.push(sqlParam);
                }
            });

            if (dataSelectExp.selects.any()) {
                dataSelectExp.where = dataSelectExp.where ? new OrExpression(dataSelectExp.where, updateExp.where) : updateExp.where;
            }

            switch (entityMetaData.concurrencyMode) {
                case "OPTIMISTIC VERSION": {
                    let versionCol: IColumnMetaData<T> = entityMetaData.versionColumn;
                    if (!versionCol) {
                        versionCol = entityMetaData.modifiedDateColumn;
                    }

                    const paramName = visitor.newAlias("param");
                    const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, versionCol.type), versionCol);
                    const sqlParam = {
                        name: paramName,
                        parameter: parameter,
                        value: entry.entity[versionCol.propertyName]
                    };
                    queryParameters.push(sqlParam);

                    const colExp = updateExp.entity.columns.first(c => c.propertyName === versionCol.propertyName);
                    const compExp = new StrictEqualExpression(colExp, parameter);
                    updateExp.addWhere(compExp);
                    break;
                }
                case "OPTIMISTIC DIRTY": {
                    modifiedColumns.each(o => {
                        const paramName = visitor.newAlias("param");
                        const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, o.type), o);
                        const sqlParam = {
                            name: paramName,
                            parameter: parameter,
                            value: entry.getOriginalValue(o.propertyName)
                        };
                        queryParameters.push(sqlParam);
                        const colExp = updateExp.entity.columns.first(c => c.propertyName === o.propertyName);
                        const compExp = new StrictEqualExpression(colExp, parameter);
                        updateExp.addWhere(compExp);
                    });
                    break;
                }
            }
            return new DeferredQuery(this, updateExp, queryParameters, (results) => {
                const effectedRows = results.sum(o => o.effectedRows);
                if (entityMetaData.concurrencyMode !== "NONE" && effectedRows <= 0) {
                    throw new Error("Concurrency Error");
                }
                return {
                    effectedRows: effectedRows,
                    rows: []
                };
            });
        }).toArray();

        // get changes done by server.
        if (autoUpdateColumns.any()) {
            result = result.concat(new DeferredQuery(this, dataSelectExp, updateSelectParameters, (results) => {
                return {
                    effectedRows: 0,
                    rows: results.selectMany(o => o.rows)
                };
            }));
        }

        return result;
    }
    protected getDeleteQueries<T>(entityMeta: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        let entryEnumerable = new Enumerable(entries);
        if (entryEnumerable.count() <= 0)
            return [];

        if (!visitor) visitor = this.queryVisitor;
        const option = visitor.options as ISaveChangesOption;
        let deleteMode: DeleteMode = !entityMeta.deletedColumn ? "Soft" : "Hard";
        if (option && option.forceHardDelete) {
            deleteMode = "Hard";
        }

        const deleteExp = new DeleteExpression(new EntityExpression(entityMeta.type, visitor.newAlias()), new ValueExpression(deleteMode));
        if (deleteExp.entity.deleteColumn && !(option && option.includeSoftDeleted)) {
            deleteExp.addWhere(new StrictEqualExpression(deleteExp.entity.deleteColumn, new ValueExpression(false)));
        }
        const queryParameters: ISqlParameter[] = [];
        if (entityMeta.primaryKeys.length === 1) {
            const primaryCol = entityMeta.primaryKeys.first();
            const primaryValues = entryEnumerable.select(o => {
                return o.entity[primaryCol.propertyName];
            }).toArray();
            const paramName = visitor.newAlias("param");
            const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, Array), primaryCol);
            queryParameters.push({
                name: paramName,
                parameter: parameter,
                value: primaryValues
            });
            deleteExp.addWhere(new MethodCallExpression(parameter, "contains", deleteExp.entity.primaryColumns));
        }
        else {
            const condition = entryEnumerable.select(o => {
                return entityMeta.primaryKeys.select(pk => {
                    const paramName = visitor.newAlias("param");
                    const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, pk.type), pk);
                    queryParameters.push({
                        name: paramName,
                        parameter: parameter,
                        value: o.entity[pk.propertyName]
                    });
                    return parameter;
                }).reduce<IExpression<boolean>>((aggregated, item) => {
                    return aggregated ? new AndExpression(aggregated, item) : item;
                });
            }).reduce<IExpression<boolean>>((aggregated, item) => {
                return aggregated ? new OrExpression(aggregated, item) : item;
            });
            deleteExp.addWhere(condition);
        }
        return [new DeferredQuery(this, deleteExp, queryParameters, (results) => {
            return {
                effectedRows: results.sum(o => o.effectedRows),
                rows: []
            };
        })];
    }
    protected getInsertQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Iterable<EntityEntry<T>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        if (!visitor) visitor = this.queryVisitor;
        let entryEnumerable = new Enumerable(entries);
        const results: DeferredQuery<IQueryResult>[] = [];

        const columns = entityMetaData.columns;
        const relations = entityMetaData.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one");
        const relationDatas = relations.selectMany(o => o.relationColumns.select(c => ({
            column: c,
            relationProperty: o.propertyName,
            fullName: o.fullName,
            relationColumn: o.relationMaps.get(c)
        })));
        const relationColumns = relationDatas.select(o => o.column);
        const valueColumns = columns.except(relationColumns).except(entityMetaData.insertGeneratedColumns);

        const entityExp = new EntityExpression(entityMetaData.type, visitor.newAlias());
        let insertExp = new InsertExpression(entityExp, []);
        let queryParameters: ISqlParameter[] = [];
        const getEntryValues = (entry: EntityEntry<T>) => {
            const values: Array<IExpression | undefined> = [];
            let primaryKeyExp: IExpression<boolean>;
            relationDatas.each(o => {
                const parentEntity = entry.entity[o.relationProperty] as any;
                if (!parentEntity) {
                    throw new Error(`${o.relationProperty} cannot be null`);
                }

                const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), o.relationColumn.type), o.relationColumn);
                const parentHasGeneratedPrimary = parentEntry.metaData.primaryKeys.any(o => !!(o.generation & ColumnGeneration.Insert) || (o.default && parentEntity[o.propertyName] === undefined));
                if (parentEntry.state === EntityState.Added && parentHasGeneratedPrimary) {
                    // TODO: get value from parent.
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.dbSet.metaData).indexOf(parentEntry);
                    param = new SqlParameterExpression(`${parentEntry.metaData.name}`, new MemberAccessExpression(new ParameterExpression(index.toString(), parentEntry.metaData.type), o.relationColumn.columnName), o.relationColumn);
                    insertExp.parameters.push(param);
                }
                else {
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: parentEntity[o.relationColumn.propertyName]
                    };
                    queryParameters.push(paramv);
                }

                values.push(param);
                if (o.column.isPrimaryColumn) {
                    const eqExp = new StrictEqualExpression(insertExp.entity.primaryColumns.first(c => c.propertyName === o.column.propertyName), param);
                    primaryKeyExp = primaryKeyExp ? new AndExpression(primaryKeyExp, eqExp) : eqExp;
                }
            });

            valueColumns.each(o => {
                let value = entry.entity[o.propertyName as keyof T];
                if (value === undefined) {
                    if (o.default)
                        values.push(undefined);
                    else
                        values.push(new ValueExpression(null));
                }
                else {
                    let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), o.type), o);
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: value
                    };
                    queryParameters.push(paramv);

                    if (o.isPrimaryColumn) {
                        const eqExp = new StrictEqualExpression(insertExp.entity.primaryColumns.first(c => c.propertyName === o.propertyName), param);
                        primaryKeyExp = primaryKeyExp ? new AndExpression(primaryKeyExp, eqExp) : eqExp;
                    }
                }
            });

            insertExp.values.push(values);

            return primaryKeyExp;
        };

        let generatedColumns = entityMetaData.insertGeneratedColumns.asEnumerable();
        if (generatedColumns.any()) {
            generatedColumns = entityMetaData.primaryKeys.union(generatedColumns);
        }

        if (entityMetaData.hasIncrementPrimary) {
            const queryBuilder = this.queryBuilder;
            // if primary key is auto increment, then need to split all query per entry.
            const incrementColumn = entityMetaData.primaryKeys.first(o => (o as any as IntegerColumnMetaData).autoIncrement);
            for (const entry of entryEnumerable) {
                getEntryValues(entry);
                results.push(new DeferredQuery(this, insertExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }));
                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = generatedColumns.select(c => entityExp.columns.first(e => e.propertyName === c.propertyName)).toArray();

                const translator = queryBuilder.resolveTranslator(DbFunction, "lastInsertedId");
                const lastId = translator ? translator.translate(null, queryBuilder) : "LAST_INSERT_ID()";
                selectExp.addWhere(new StrictEqualExpression(entityExp.columns.first(c => c.propertyName === incrementColumn.columnName), new RawSqlExpression(incrementColumn.type, lastId)));
                results.push(new DeferredQuery(this, selectExp, [], (results) => {
                    return {
                        effectedRows: 0,
                        rows: results.selectMany(o => o.rows)
                    };
                }));

                // reset
                insertExp = new InsertExpression(entityExp, []);
                queryParameters = [];
            }
        }
        else {
            const selectExp = new SelectExpression(entityExp);
            selectExp.selects = generatedColumns.select(c => entityExp.columns.first(e => e.propertyName === c.propertyName)).toArray();

            const arrayValue = new ArrayValueExpression();
            entryEnumerable.each(entry => {
                const entryFilterExp = getEntryValues(entry);
                if (entityMetaData.primaryKeys.length === 1) {
                    arrayValue.items.push((entryFilterExp as StrictEqualExpression).rightOperand);
                }
                else {
                    selectExp.where = selectExp.where ? new OrExpression(selectExp.where, entryFilterExp) : entryFilterExp;
                }
            });

            if (entityMetaData.primaryKeys.length === 1) {
                selectExp.addWhere(new MethodCallExpression(arrayValue, "contains", [entityExp.primaryColumns.first()]));
            }
            results.push(new DeferredQuery(this, insertExp, queryParameters, (results) => {
                return {
                    effectedRows: results.sum(o => o.effectedRows),
                    rows: []
                };
            }));
            if (generatedColumns.any()) {
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

        if (!visitor) visitor = this.queryVisitor;
        const option = visitor.options as ISaveChangesOption;
        let entryEnumerable = new Enumerable(entries);
        const results: DeferredQuery<IQueryResult>[] = [];

        const columns = entityMeta.columns;
        let generatedColumns = entityMeta.insertGeneratedColumns.union(entityMeta.updateGeneratedColumns);

        const relations = entityMeta.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one");
        const relationDatas = relations.selectMany(o => o.relationColumns.select(c => ({
            column: c,
            relationProperty: o.propertyName,
            fullName: o.fullName,
            relationColumn: o.relationMaps.get(c)
        })));
        const relationColumns = relationDatas.select(o => o.column);
        const valueColumns = columns.except(relationColumns).except(generatedColumns);

        const entityExp = new EntityExpression(entityMeta.type, visitor.newAlias());
        let upsertExp = new UpsertExpression(entityExp, []);
        let queryParameters: ISqlParameter[] = [];
        const getEntryValues = (entry: EntityEntry<T>) => {
            let primaryKeyExp: IExpression<boolean>;
            relationDatas.each(o => {
                const parentEntity = entry.entity[o.relationProperty] as any;
                if (!parentEntity) {
                    throw new Error(`${o.relationProperty} cannot be null`);
                }

                const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), o.relationColumn.type), o.relationColumn);
                const parentHasGeneratedPrimary = parentEntry.metaData.primaryKeys.any(o => !!(o.generation & ColumnGeneration.Insert) || (o.default && parentEntity[o.propertyName] === undefined));
                if (parentEntry.state === EntityState.Added && parentHasGeneratedPrimary) {
                    // TODO: get value from parent.
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.dbSet.metaData).indexOf(parentEntry);
                    param = new SqlParameterExpression(`${parentEntry.metaData.name}`, new MemberAccessExpression(new ParameterExpression(index.toString(), parentEntry.metaData.type), o.relationColumn.columnName), o.relationColumn);
                    upsertExp.parameters.push(param);
                }
                else {
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: parentEntity[o.relationColumn.propertyName]
                    };
                    queryParameters.push(paramv);
                }

                upsertExp.values.push(param);
                if (o.column.isPrimaryColumn) {
                    const eqExp = new StrictEqualExpression(upsertExp.entity.primaryColumns.first(c => c.propertyName === o.column.propertyName), param);
                    primaryKeyExp = primaryKeyExp ? new AndExpression(primaryKeyExp, eqExp) : eqExp;
                }
            });

            valueColumns.each(o => {
                let value = entry.entity[o.propertyName as keyof T];
                if (value === undefined) {
                    if (o.default)
                        upsertExp.values.push(undefined);
                    else
                        upsertExp.values.push(new ValueExpression(null));
                }
                else {
                    let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), o.type), o);
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: value
                    };
                    queryParameters.push(paramv);

                    if (o.isPrimaryColumn) {
                        const eqExp = new StrictEqualExpression(upsertExp.entity.primaryColumns.first(c => c.propertyName === o.propertyName), param);
                        primaryKeyExp = primaryKeyExp ? new AndExpression(primaryKeyExp, eqExp) : eqExp;
                    }
                }
            });

            return primaryKeyExp;
        };

        if (generatedColumns.any()) {
            generatedColumns = entityMeta.primaryKeys.union(generatedColumns);
        }

        const selectExp = new SelectExpression(entityExp);
        if (entityMeta.deletedColumn && !(option && option.includeSoftDeleted)) {
            selectExp.addWhere(new StrictEqualExpression(selectExp.entity.deleteColumn, new ValueExpression(false)));
        }
        const arrayValue = new ArrayValueExpression();

        for (const entry of entryEnumerable) {
            const entryFilterExp = getEntryValues(entry);
            // select filter
            if (entityMeta.primaryKeys.length === 1) {
                arrayValue.items.push((entryFilterExp as StrictEqualExpression).rightOperand);
            }
            else {
                selectExp.where = selectExp.where ? new OrExpression(selectExp.where, entryFilterExp) : entryFilterExp;
            }

            if (entry.state === EntityState.Added) {
                upsertExp.updateColumns = entityExp.columns.where(o => !o.isPrimary).toArray();
            }
            else {
                upsertExp.updateColumns = entityExp.columns.where(o => !o.isPrimary && entry.isPropertyModified(o.propertyName)).toArray();
            }

            results.push(new DeferredQuery(this, upsertExp, queryParameters, (results) => {
                return {
                    effectedRows: results.max(o => o.effectedRows),
                    rows: []
                };
            }));

            // reset
            upsertExp = new UpsertExpression(entityExp, []);
            queryParameters = [];
        }

        if (generatedColumns.any()) {
            // only select query if there is at least a generated column exist.
            selectExp.selects = generatedColumns.select(c => entityExp.columns.first(e => e.propertyName === c.propertyName)).toArray();

            const arrayValue = new ArrayValueExpression();
            entryEnumerable.each(entry => {
                const entryFilterExp = getEntryValues(entry);
                if (entityMeta.primaryKeys.length === 1) {
                    arrayValue.items.push((entryFilterExp as StrictEqualExpression).rightOperand);
                }
                else {
                    selectExp.where = selectExp.where ? new OrExpression(selectExp.where, entryFilterExp) : entryFilterExp;
                }
            });

            if (entityMeta.primaryKeys.length === 1) {
                selectExp.addWhere(new MethodCallExpression(arrayValue, "contains", [entityExp.primaryColumns.first()]));
            }

            results.push(new DeferredQuery(this, selectExp, results.selectMany(o => o.parameters).toArray(), (results) => {
                return {
                    effectedRows: 0,
                    rows: results.selectMany(o => o.rows)
                };
            }));
        }

        return results;
    }
    protected getRelationAddQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: Iterable<RelationEntry<T, T2, TData>>): DeferredQuery<IQueryResult>[] {
        const visitor = this.queryVisitor;
        const option = visitor.options as ISaveChangesOption;
        const entityExp = new EntityExpression(slaveRelationMetaData.source.type, visitor.newAlias());
        return new Enumerable(relationEntries).selectMany(relationEntry => {
            const results: DeferredQuery<IQueryResult>[] = [];

            const isMasterAdded = relationEntry.masterEntry.state === EntityState.Added;
            if (slaveRelationMetaData.relationType === "one") {
                let queryParameters: ISqlParameter[] = [];
                const updateExp = new UpdateExpression(entityExp, {});
                if (updateExp.entity.deleteColumn && !(option && option.includeSoftDeleted)) {
                    updateExp.addWhere(new StrictEqualExpression(updateExp.entity.deleteColumn, new ValueExpression(false)));
                }
                slaveRelationMetaData.relationColumns.each(o => {
                    const alias = visitor.newAlias("param");
                    let param = new SqlParameterExpression(alias, new ParameterExpression(alias, o.type), o);
                    if (isMasterAdded) {
                        // TODO: get value from parent.
                        const index = relationEntry.masterEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.masterEntry.dbSet.metaData).indexOf(relationEntry.masterEntry);
                        param = new SqlParameterExpression(`${relationEntry.masterEntry.metaData.name}`, new MemberAccessExpression(new ParameterExpression(index.toString(), relationEntry.masterEntry.metaData.type), o.columnName), o);
                        updateExp.parameters.push(param);
                    }
                    else {
                        const reverseProperty = relationEntry.slaveRelation.relationMaps.get(o).propertyName as keyof T2;
                        const paramv: ISqlParameter = {
                            name: alias,
                            parameter: param,
                            value: relationEntry.masterEntry.entity[reverseProperty]
                        };
                        queryParameters.push(paramv);
                    }
                    updateExp.setter[o.propertyName] = param;
                });

                slaveRelationMetaData.source.primaryKeys.each(o => {
                    const alias = visitor.newAlias("param");
                    let param = new SqlParameterExpression(alias, new ParameterExpression(alias, o.type), o);
                    const paramv: ISqlParameter = {
                        name: alias,
                        parameter: param,
                        value: relationEntry.slaveEntry.entity[o.propertyName]
                    };
                    queryParameters.push(paramv);
                    updateExp.addWhere(new StrictEqualExpression(entityExp.primaryColumns.first(c => c.propertyName === o.propertyName), param));
                });

                results.push(new DeferredQuery(this, updateExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }));
            }
            else {
                const relationDataMeta = relationEntry.slaveRelation.relationData;
                const insertExp = new InsertExpression(new EntityExpression(relationDataMeta.type, visitor.newAlias()), []);
                const queryParameters: ISqlParameter[] = [];

                const values = relationDataMeta.sourceRelationColumns.select(o => {
                    const sourceCol = relationDataMeta.sourceRelationMaps.get(o);
                    const alias = visitor.newAlias("param");
                    let param = new SqlParameterExpression(alias, new ParameterExpression(alias, o.type), o);
                    if (isMasterAdded) {
                        // TODO: get value from parent.
                        const index = relationEntry.masterEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.masterEntry.dbSet.metaData).indexOf(relationEntry.masterEntry);
                        param = new SqlParameterExpression(relationEntry.masterEntry.metaData.name, new MemberAccessExpression(new ParameterExpression(index.toString(), relationEntry.masterEntry.metaData.type), sourceCol.columnName), o);
                        insertExp.parameters.push(param);
                    }
                    else {
                        const relProperty = sourceCol.propertyName as keyof T2;
                        const paramv: ISqlParameter = {
                            name: alias,
                            parameter: param,
                            value: relationEntry.masterEntry.entity[relProperty]
                        };
                        queryParameters.push(paramv);
                    }
                    return param;
                }).union(relationDataMeta.targetRelationColumns.except(relationDataMeta.sourceRelationColumns).select(o => {
                    const targetCol = relationDataMeta.targetRelationMaps.get(o);
                    const alias = visitor.newAlias("param");
                    let param = new SqlParameterExpression(alias, new ParameterExpression(alias, o.type), o);
                    if (isMasterAdded) {
                        // TODO: get value from parent.
                        const index = relationEntry.slaveEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.slaveEntry.dbSet.metaData).indexOf(relationEntry.slaveEntry);
                        param = new SqlParameterExpression(relationEntry.masterEntry.metaData.name, new MemberAccessExpression(new ParameterExpression(index.toString(), relationEntry.masterEntry.metaData.type), targetCol.columnName), o);
                        insertExp.parameters.push(param);
                    }
                    else {
                        const relProperty = targetCol.propertyName as keyof T;
                        const paramv: ISqlParameter = {
                            name: alias,
                            parameter: param,
                            value: relationEntry.slaveEntry.entity[relProperty]
                        };
                        queryParameters.push(paramv);
                    }
                    return param;
                })).toArray();
                insertExp.values.push(values);

                results.push(new DeferredQuery(this, insertExp, queryParameters, (results) => {
                    return {
                        effectedRows: 0,
                        rows: results.selectMany(o => o.rows)
                    };
                }));
            }
            return results;
        }).toArray();
    }
    protected getRelationDeleteQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: Iterable<RelationEntry<T, T2, TData>>, visitor?: QueryVisitor): DeferredQuery<IQueryResult>[] {
        if (!visitor) visitor = this.queryVisitor;
        const option = visitor.options as ISaveChangesOption;
        let relationEntryEnumerable = new Enumerable(relationEntries);
        const isManyToMany = slaveRelationMetaData.relationType === "many";
        let result: DeferredQuery<IQueryResult>[] = [];
        if (!isManyToMany) {
            // only process relation that it's slave entity not deleted.
            relationEntryEnumerable = relationEntryEnumerable.where(o => o.slaveEntry.state !== EntityState.Deleted);
            const queryParameters: ISqlParameter[] = [];
            const slaveEntity = new EntityExpression(slaveRelationMetaData.source.type, visitor.newAlias());
            const slaveSelect = new SelectExpression(slaveEntity);
            if (slaveEntity.deleteColumn && !(option && option.includeSoftDeleted)) {
                slaveSelect.addWhere(new StrictEqualExpression(slaveEntity.deleteColumn, new ValueExpression(false)));
            }
            if (slaveRelationMetaData.source.primaryKeys.length === 1) {
                const arrayExp = new ArrayValueExpression();
                const primaryCol = slaveRelationMetaData.source.primaryKeys.first();
                arrayExp.items = relationEntryEnumerable.select(o => {
                    let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), primaryCol.type), primaryCol);
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: o.slaveEntry.entity[primaryCol.propertyName]
                    };
                    queryParameters.push(paramv);
                    return param;
                }).toArray();
                slaveSelect.addWhere(new MethodCallExpression(arrayExp, "contains", [slaveEntity.primaryColumns.first()]));
            }
            else {
                const condition = relationEntryEnumerable.select(o => {
                    return slaveRelationMetaData.source.primaryKeys.select(pk => {
                        let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), pk.type), pk);
                        const paramv: ISqlParameter = {
                            name: "",
                            parameter: param,
                            value: o.slaveEntry.entity[pk.propertyName]
                        };
                        queryParameters.push(paramv);
                        return param;
                    }).reduce<IExpression<boolean>>((ac, item) => ac ? new AndExpression(ac, item) : ac);
                }).reduce<IExpression<boolean>>((ac, item) => ac ? new OrExpression(ac, item) : ac);
                slaveSelect.addWhere(condition);
            }

            // delete relation data if exist.
            if (slaveRelationMetaData.relationData) {
                const relationData = new EntityExpression<TData>(slaveRelationMetaData.relationData.type, slaveRelationMetaData.relationData.name, true);
                const dataDelete = new DeleteExpression(relationData, new ValueExpression<DeleteMode>("Hard"));

                let relations: IExpression<boolean>;
                for (const [relColMeta, childColMeta] of slaveRelationMetaData.relationData.targetRelationMaps) {
                    const relationCol = dataDelete.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = slaveSelect.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                    const logicalExp = new StrictEqualExpression(relationCol, childCol);
                    relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
                }
                dataDelete.addJoinRelation(slaveSelect, relations, JoinType.INNER);

                result.push(new DeferredQuery(this, dataDelete, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }));
            }

            if (slaveRelationMetaData.nullable) {
                // set foreignkey to null query.
                const set = slaveRelationMetaData.relationColumns
                    .reduce<{ [key in keyof T]?: IExpression<any> }>((acc, o) => {
                        acc[o.propertyName] = new ValueExpression(null);
                        return acc;
                    }, {});

                const updateExp = new UpdateExpression(slaveSelect, set);
                result.push(new DeferredQuery(this, updateExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }));
            }
            else {
                // delete slave entity
                const deleteExp = new DeleteExpression(slaveSelect);
                result.push(new DeferredQuery(this, deleteExp, queryParameters, (results) => {
                    return {
                        effectedRows: results.sum(o => o.effectedRows),
                        rows: []
                    };
                }));
            }
        }
        else {
            // remove relation table.
            // after save remove all reference to this relation entry.
            const queryParameters: ISqlParameter[] = [];

            const condition = relationEntryEnumerable.select(o => {
                return slaveRelationMetaData.source.primaryKeys.select(pk => {
                    let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), pk.type), pk);
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: o.slaveEntry.entity[pk.propertyName]
                    };
                    queryParameters.push(paramv);
                    return param;
                }).union(slaveRelationMetaData.target.primaryKeys.select(pk => {
                    let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), pk.type), pk);
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: param,
                        value: o.masterEntry.entity[pk.propertyName]
                    };
                    queryParameters.push(paramv);
                    return param;
                })).reduce<IExpression<boolean>>((ac, item) => {
                    return ac ? new AndExpression(ac, item) : ac;
                });
            }).reduce<IExpression<boolean>>((ac, item) => {
                return ac ? new OrExpression(ac, item) : ac;
            });

            const relationData = new EntityExpression<TData>(slaveRelationMetaData.relationData.type, slaveRelationMetaData.relationData.name, true);
            const deleteExp = new DeleteExpression(relationData, new ValueExpression<DeleteMode>("Hard"));
            deleteExp.addWhere(condition);

            result.push(new DeferredQuery(this, deleteExp, queryParameters, (results) => {
                return {
                    effectedRows: results.sum(o => o.effectedRows),
                    rows: []
                };
            }));
        }

        return result;
    }
    //#endregion
}
