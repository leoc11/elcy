import { ICacheOption } from "../Cache/ICacheOption";
import { IQueryCacheManager } from "../Cache/IQueryCacheManager";
import { IResultCacheManager } from "../Cache/IResultCacheManager";
import { QueryType } from "../Common/Enum";
import { DbType, DeleteMode, IsolationLevel } from "../Common/StringType";
import { FlatObjectLike, GenericType, IObjectType, KeysExceptType, TypeItem, ValueType } from "../Common/Type";
import { DefaultConnectionManager } from "../Connection/DefaultConnectionManager";
import { IConnection } from "../Connection/IConnection";
import { IConnectionManager } from "../Connection/IConnectionManager";
import { IDriver } from "../Connection/IDriver";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { Diagnostic } from "../Logger/Diagnostic";
import { IDeleteEventParam } from "../MetaData/Interface/IDeleteEventParam";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { ISaveEventParam } from "../MetaData/Interface/ISaveEventParam";
import { DeferredQuery } from "../Query/DeferredQuery/DeferredQuery";
import { DMLDeferredQuery } from "../Query/DeferredQuery/DMLDeferredQuery";
import { DQLDeferredQuery } from "../Query/DeferredQuery/DQLDeferredQuery";
import { ExecuteDeferredQuery } from "../Query/DeferredQuery/ExecuteDeferredQuery";
import { IQuery } from "../Query/IQuery";
import { IQueryBuilder } from "../Query/IQueryBuilder";
import { IQueryOption } from "../Query/IQueryOption";
import { IQueryResult } from "../Query/IQueryResult";
import { IQueryResultParser } from "../Query/IQueryResultParser";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { ISchemaBuilder } from "../Query/ISchemaBuilder";
import { NamingStrategy } from "../Query/NamingStrategy";
import { QueryTranslator } from "../Query/QueryTranslator";
import { Queryable } from "../Queryable/Queryable";
import { QueryExpression } from "../Queryable/QueryExpression/QueryExpression";
import { RawQueryable } from "../Queryable/RawQueryable";
import { DbSet } from "./DbSet";
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";
import { EntityEntry } from "./EntityEntry";
import { EntityState } from "./EntityState";
import { IDBEventListener } from "./Event/IDBEventListener";
import { RelationEntry } from "./RelationEntry";
import { RelationState } from "./RelationState";

export type IChangeEntryMap<T extends string, TKey, TValue> = { [K in T]: Map<TKey, TValue[]> };
const connectionManagerKey = Symbol("connectionManagerKey");
const queryCacheManagerKey = Symbol("queryCacheManagerKey");
const resultCacheManagerKey = Symbol("resultCacheManagerKey");

export abstract class DbContext<TDB extends DbType = any> implements IDBEventListener<any> {
    public get connectionManager() {
        if (!this._connectionManager) {
            this._connectionManager = Reflect.getOwnMetadata(connectionManagerKey, this.constructor);
            if (!this._connectionManager) {
                const conManagerOrDriver = this.factory();
                if ((conManagerOrDriver as IConnectionManager<TDB>).getAllConnections) {
                    this._connectionManager = conManagerOrDriver as IConnectionManager<TDB>;
                }
                else {
                    const driver = conManagerOrDriver as IDriver<TDB>;
                    this._connectionManager = new DefaultConnectionManager(driver);
                }
                Reflect.defineMetadata(connectionManagerKey, this._connectionManager, this.constructor);
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
            this._queryCacheManager = Reflect.getOwnMetadata(queryCacheManagerKey, this.constructor);
            if (!this._queryCacheManager) {
                this._queryCacheManager = this.queryCacheManagerFactory();
                Reflect.defineMetadata(queryCacheManagerKey, this._queryCacheManager, this.constructor);
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
            this._resultCacheManager = Reflect.getOwnMetadata(resultCacheManagerKey, this.constructor);
            if (!this._resultCacheManager) {
                this._resultCacheManager = this.resultCacheManagerFactory();
                Reflect.defineMetadata(resultCacheManagerKey, this._resultCacheManager, this.constructor);
            }
        }

        return this._resultCacheManager;
    }
    constructor(factory?: () => IConnectionManager<TDB> | IDriver<TDB>, types: IObjectType[] = []) {
        if (factory) {
            this.factory = factory;
        }
        this.relationEntries = {
            add: new Map(),
            delete: new Map()
        };
        this.entityEntries = {
            add: new Map(),
            delete: new Map(),
            update: new Map()
        };
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
    public entityEntries: IChangeEntryMap<"add" | "update" | "delete", IEntityMetaData, EntityEntry>;
    public readonly entityTypes: Array<IObjectType<any>>;
    public modifiedEmbeddedEntries: Map<IEntityMetaData<any>, EmbeddedEntityEntry[]> = new Map();
    public relationEntries: IChangeEntryMap<"add" | "delete", IRelationMetaData, RelationEntry>;
    protected readonly factory: () => IConnectionManager<TDB> | IDriver<TDB>;
    protected abstract readonly namingStrategy: NamingStrategy;
    protected abstract readonly queryBuilderType: IObjectType<IQueryBuilder>;
    protected readonly queryCacheManagerFactory?: () => IQueryCacheManager;
    protected abstract readonly queryResultParserType: IObjectType<IQueryResultParser>;
    protected abstract readonly queryVisitorType: IObjectType<IQueryVisitor>;
    protected readonly resultCacheManagerFactory?: () => IResultCacheManager;
    protected abstract readonly schemaBuilderType: IObjectType<ISchemaBuilder>;
    protected abstract readonly translator: QueryTranslator;
    private _cachedDbSets: Map<IObjectType, DbSet<any>> = new Map();
    private _connectionManager: IConnectionManager<TDB>;
    private _queryCacheManager: IQueryCacheManager;
    private _resultCacheManager: IResultCacheManager;

    //#region Entry
    public entry<T>(entity: T) {
        const set = this.set<T>(entity.constructor as IObjectType<T>);
        if (set) {
            return set.entry(entity);
        }
        return null;
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
                            const relationEntry = entry.getRelation(relation.propertyName, relEntry as EntityEntry);
                            relationEntry.state = RelationState.Unchanged;
                        }
                        else if (Array.isArray(relEntity)) {
                            for (const itemEntity of relEntity) {
                                const relEntry = this.attach(itemEntity, true);
                                const relationEntry = entry.getRelation(relation.propertyName, relEntry);
                                relationEntry.state = RelationState.Unchanged;
                            }
                        }
                    }
                }
                for (const relation of entry.metaData.embeds) {
                    const relEntity = entity[relation.propertyName];
                    if (relEntity) {
                        const relEntry = this.attach(relEntity, true);
                        if (relEntry) {
                            entity[relation.propertyName] = relEntry.entity;
                        }
                    }
                }
            }
        }

        return entry;
    }
    public detach<T>(entity: T) {
        const entry = this.entry(entity);
        if (entry && entry.state !== EntityState.Detached) {
            entry.state = EntityState.Detached;
        }
        return entry;
    }
    public add<T>(entity: T) {
        const entry = this.attach(entity);
        if (entry) {
            entry.add();
        }
        return entry;
    }
    public update<T>(entity: T, originalValues?: FlatObjectLike<T>) {
        const entry = this.attach(entity);
        if (entry) {
            if (originalValues instanceof Object) {
                entry.setOriginalValues(originalValues);
            }
            entry.state = EntityState.Modified;
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
    public relationEntry<T, TKey extends KeysExceptType<T, ValueType>>(entity1: T, propertyName: TKey, entity2: TypeItem<T[TKey]>) {
        const entry1 = this.entry(entity1);
        const entry2 = this.entry(entity2);
        return entry1.getRelation(propertyName, entry2);
    }
    public relationAttach<T, TKey extends KeysExceptType<T, ValueType>>(entity1: T, propertyName: TKey, entity2: TypeItem<T[TKey]>) {
        const entry = this.relationEntry(entity1, propertyName, entity2);
        if (entry && entry.state === RelationState.Detached) {
            entry.state = RelationState.Unchanged;
        }
        return entry;
    }
    public relationDetach<T, TKey extends KeysExceptType<T, ValueType>>(entity1: T, propertyName: TKey, entity2: TypeItem<T[TKey]>) {
        const entry = this.relationEntry(entity1, propertyName, entity2);
        if (entry && entry.state !== RelationState.Detached) {
            entry.state = RelationState.Detached;
        }
        return entry;
    }
    public relationAdd<T, TKey extends KeysExceptType<T, ValueType>>(entity1: T, propertyName: TKey, entity2: TypeItem<T[TKey]>) {
        const entry = this.relationAttach(entity1, propertyName, entity2);
        if (entry) {
            entry.add();
        }
        return entry;
    }
    public relationDelete<T, TKey extends KeysExceptType<T, ValueType>>(entity1: T, propertyName: TKey, entity2: TypeItem<T[TKey]>) {
        const entry = this.relationAttach(entity1, propertyName, entity2);
        if (entry) {
            entry.delete();
        }
        return entry;
    }
    //#endregion
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

    // -------------------------------------------------------------------------
    // Query Function
    // -------------------------------------------------------------------------
    public async executeDeferred(deferredQueries?: IEnumerable<DeferredQuery>) {
        if (!deferredQueries) {
            deferredQueries = this.deferredQueries.splice(0);
        }

        // check cached
        if (this.resultCacheManager) {
            deferredQueries = deferredQueries.toArray();
            const cacheQueries = deferredQueries.where((o) => o instanceof DQLDeferredQuery && o.queryOption.resultCache !== "none");
            const cachedResults = await this.resultCacheManager.gets(cacheQueries.select((o) => o.hashCode().toString()));
            let index = 0;
            for (const cacheQuery of cacheQueries) {
                const res = cachedResults[index++];
                if (res) {
                    cacheQuery.resolve(res);
                    deferredQueries.delete(cacheQuery);
                }
            }
        }

        const queries = deferredQueries.selectMany((o) => o.queries);
        if (!queries.any()) {
            return;
        }

        const queryResult: IQueryResult[] = await this.executeQueries(...queries);

        for (const deferredQuery of deferredQueries) {
            const results = queryResult.splice(0, deferredQuery.queries.length);
            deferredQuery.resolve(results);

            // cache result
            if (this.resultCacheManager) {
                if (deferredQuery instanceof DQLDeferredQuery) {
                    const queryOption = deferredQuery.queryOption;
                    if (queryOption.resultCache !== "none") {
                        const cacheOption = (queryOption.resultCache || {}) as ICacheOption;
                        if (queryOption.resultCache && queryOption.resultCache.invalidateOnUpdate) {
                            cacheOption.tags = deferredQuery.entities.select((o) => `entity:${o.name}`).toArray();
                        }
                        this.resultCacheManager.set(deferredQuery.hashCode().toString(), results, cacheOption);
                    }
                }
                else if (deferredQuery instanceof DMLDeferredQuery) {
                    const effecteds = deferredQuery.entities.select((o) => `entity:${o.name}`);
                    this.resultCacheManager.removeTag(effecteds);
                }
            }
        }
    }
    //#endregion

    public async executeQueries(...queries: IQuery[]): Promise<IQueryResult[]> {
        let results: IQueryResult[] = [];
        if (queries.any()) {
            const con = await this.getConnection(queries.any((o) => !!(o.type & QueryType.DQL)));
            if (!con.isOpen) {
                await con.open();
            }
            const timer = Diagnostic.timer(false);
            timer && timer.start();
            if (Diagnostic.enabled) {
                Diagnostic.debug(con, `Execute Query.`, queries);
            }
            results = await con.query(...queries);
            if (Diagnostic.enabled) {
                Diagnostic.debug(con, `Query Result.`, results);
                Diagnostic.trace(con, `Execute Query time: ${timer.time()}ms`);
            }
            // No need to wait connection close
            this.closeConnection(con);
        }
        return results;
    }
    // Parameter placeholder: ${paramname}
    public query<T = any>(schema: { [K in keyof T]?: GenericType<ValueType & T[K]> }, sql: string, type?: GenericType<T>): Queryable<T>;
    public query<T = any>(schema: { [K in keyof T]?: GenericType<ValueType & T[K]> }, sql: string, parameters?: { [key: string]: any }, type?: GenericType<T>): Queryable<T>;
    public query<T = any>(schema: { [K in keyof T]?: GenericType<ValueType & T[K]> }, sql: string, parametersOrType?: { [key: string]: any } | GenericType<T>, type?: GenericType<T>): Queryable<T> {
        let parameters: { [key: string]: any } = null;
        if (!type && parametersOrType instanceof Function) {
            type = parametersOrType;
        }
        else {
            parameters = parametersOrType;
        }

        return new RawQueryable(this, schema, sql, parameters, type);
    }
    // Parameter placeholder: ${paramname}
    public execute(sql: string, parameters?: { [key: string]: any }) {
        const query = this.deferredExecute(sql, parameters);
        return query.execute();
    }
    public deferredExecute(sql: string, parameters?: { [key: string]: any }): DeferredQuery<number> {
        return new ExecuteDeferredQuery(this, sql, parameters);
    }
    public async getConnection(writable?: boolean) {
        const con = this.connection ? this.connection : await this.connectionManager.getConnection(writable);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `Get connection. used existing connection: ${!!this.connection}`);
        }
        return con;
    }
    public getQueryResultParser(command: QueryExpression, queryBuilder: IQueryBuilder): IQueryResultParser {
        const queryParser = new this.queryResultParserType();
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
    public schemaBuilder() {
        const schemaBuilder = new this.schemaBuilderType();
        schemaBuilder.queryBuilder = this.queryBuilder;
        return schemaBuilder;
    }
    //#endregion

    //#region Update
    public abstract saveChanges(options?: IQueryOption): Promise<number>;

    //#region Entity Tracker
    public set<T>(type: IObjectType<T>, isClearCache = false): DbSet<T> {
        let result: DbSet<T>;
        if (!isClearCache) {
            result = this._cachedDbSets.get(type);
        }
        if (!result && this.entityTypes.contains(type)) {
            result = new DbSet(type, this);
            this._cachedDbSets.set(type, result);
        }
        return result;
    }
    public async syncSchema() {
        const schemaQuery = await this.getUpdateSchemaQueries(this.entityTypes);
        const commands = schemaQuery.commit;

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
        let isSavePoint: boolean;
        let error: Error;
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
        }
        catch (e) {
            error = e;
            if (Diagnostic.enabled) {
                Diagnostic.error(this.connection, e instanceof Error ? e.message : "Error", e);
            }
        }
        finally {
            if (!error) {
                await this.connection.commitTransaction();
                if (Diagnostic.enabled) {
                    Diagnostic.debug(this.connection, isSavePoint ? "commit transaction save point" : "Commit transaction");
                }
            }
            else {
                await this.connection.rollbackTransaction();
                if (Diagnostic.enabled) {
                    Diagnostic.debug(this.connection, isSavePoint ? "rollback transaction save point" : "rollback transaction");
                }
            }
            if (!isSavePoint) {
                await this.closeConnection();
            }
        }

        if (error) {
            throw error;
        }
    }
    public abstract getDeleteQuery<T>(entry: EntityEntry<T>, deleteMode?: DeleteMode): DMLDeferredQuery<T>;
    public abstract getInsertQuery<T>(entry: EntityEntry<T>): DMLDeferredQuery<T>;
    public abstract getRelationAddQuery<T, T2, TData>(relationEntry: RelationEntry<T, T2, TData>): DMLDeferredQuery;
    public abstract getRelationDeleteQuery<T, T2, TData>(relationEntry: RelationEntry<T, T2, TData>): DMLDeferredQuery;
    public abstract getUpdateQuery<T>(entry: EntityEntry<T>): DMLDeferredQuery<T>;
    public abstract getUpsertQuery<T>(entry: EntityEntry<T>): DMLDeferredQuery<T>;
    //#endregion
}
