import { IQueryCacheManager } from "../Cache/IQueryCacheManager";
import { IResultCacheManager } from "../Cache/IResultCacheManager";
import { ColumnGeneration, QueryType } from "../Common/Enum";
import { DbType, DeleteMode, IsolationLevel } from "../Common/StringType";
import { FlatObjectLike, GenericType, IObjectType, KeysExceptType, TypeItem, ValueType } from "../Common/Type";
import { DefaultConnectionManager } from "../Connection/DefaultConnectionManager";
import { IConnection } from "../Connection/IConnection";
import { IConnectionManager } from "../Connection/IConnectionManager";
import { IDriver } from "../Connection/IDriver";
import { Enumerable } from "../Enumerable/Enumerable";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { OrExpression } from "../ExpressionBuilder/Expression/OrExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { isValue } from "../Helper/Util";
import { Diagnostic } from "../Logger/Diagnostic";
import { IntegerColumnMetaData } from "../MetaData/IntegerColumnMetaData";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IDeleteEventParam } from "../MetaData/Interface/IDeleteEventParam";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { ISaveEventParam } from "../MetaData/Interface/ISaveEventParam";
import { DeferredQuery } from "../Query/DeferredQuery";
import { IQuery } from "../Query/IQuery";
import { IQueryBuilder } from "../Query/IQueryBuilder";
import { IQueryOption } from "../Query/IQueryOption";
import { IQueryParameterMap } from "../Query/IQueryParameter";
import { IQueryResult } from "../Query/IQueryResult";
import { IQueryResultParser } from "../Query/IQueryResultParser";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { ISchemaBuilder } from "../Query/ISchemaBuilder";
import { NamingStrategy } from "../Query/NamingStrategy";
import { QueryTranslator } from "../Query/QueryTranslator";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { insertEntryExp, InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { RawSqlExpression } from "../Queryable/QueryExpression/RawSqlExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression, updateItemExp } from "../Queryable/QueryExpression/UpdateExpression";
import { upsertEntryExp, UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";
import { DbSet } from "./DbSet";
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";
import { EntityEntry } from "./EntityEntry";
import { EntityState } from "./EntityState";
import { DBEventEmitter } from "./Event/DbEventEmitter";
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
                Reflect.defineMetadata(queryCacheManagerKey, this._queryCacheManager, this.constructor);
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

    //#region DB Event Listener
    public beforeSave?: <T>(entity: T, param: ISaveEventParam) => boolean;
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
                            const relationEntry = entry.getRelation(relation.propertyName, relEntry);
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
    public async deferredFromSql<T>(type: GenericType<T>, rawQuery: string, parameters?: { [key: string]: any }) {
        const queryCommand: IQuery = {
            query: rawQuery,
            type: QueryType.DDL,
            parameters: new Map()
        };
        const command: IQueryExpression = {
            paramExps: [],
            type: type as IObjectType,
            clone: () => command,
            hashCode: () => 0,
            getEffectedEntities: () => []
        };
        if (parameters) {
            for (const prop in parameters) {
                const value = parameters[prop];
                queryCommand.parameters.set(prop, value);
            }
        }
        const query = new DeferredQuery(this, command, new Map(), (result) => result.selectMany((o) => o.rows).select((o) => {
            let item: T = new (type as IObjectType)();
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
    public async executeDeferred(deferredQueries?: IEnumerable<DeferredQuery>) {
        if (!deferredQueries) {
            deferredQueries = this.deferredQueries.splice(0);
        }

        const queryBuilder = this.queryBuilder;

        // check cached
        if (this.resultCacheManager) {
            deferredQueries = deferredQueries.toArray();
            const cacheQueries = deferredQueries.where((o) => o.command instanceof SelectExpression && o.queryOption.resultCache !== "none");
            const cachedResults = await this.resultCacheManager.gets(...cacheQueries.select((o) => o.hashCode().toString()).toArray());
            let index = 0;
            for (const cacheQuery of cacheQueries) {
                const res = cachedResults[index++];
                if (res) {
                    cacheQuery.buildQuery(queryBuilder);
                    cacheQuery.resolve(res);
                    deferredQueries.delete(cacheQuery);
                }
            }
        }

        // analyze parameters
        // db has parameter size limit and query size limit.
        const paramPrefix = queryBuilder.namingStrategy.getAlias("param");
        let i = 0;
        const paramNameMap = new Map<any, string>();
        for (const [key, p] of deferredQueries.selectMany((o) => o.parameters)) {
            let alias = paramNameMap.get(p.value);
            if (!alias) {
                alias = paramPrefix + i++;
                paramNameMap.set(p.value, alias);
            }
            p.name = alias;
            p.value = queryBuilder.toParameterValue(p.value, key.column);
        }

        const queries = deferredQueries.selectMany((o) => o.buildQuery(queryBuilder));
        const mergedQueries = queryBuilder.mergeQueries(queries);
        if (!mergedQueries.any()) {
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
                            queryOption.resultCache.tags = queryOption.resultCache.tags.union(deferredQuery.command.getEffectedEntities().select((o) => `entity:${o.name}`)).distinct().toArray();
                        }
                        this.resultCacheManager.set(deferredQuery.hashCode().toString(), results, queryOption.resultCache);
                    }
                }
                else {
                    const effecteds = deferredQuery.command.getEffectedEntities().select((o) => `entity:${o.name}`).toArray();
                    this.resultCacheManager.removeTag(...effecteds);
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
            for (const query of queries) {
                timer && timer.start();
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
    public async fromSql<T>(type: GenericType<T>, rawQuery: string, parameters?: { [key: string]: any }): Promise<T[]> {
        const query = await this.deferredFromSql(type, rawQuery, parameters);
        return await query.execute();
    }
    public async getConnection(writable?: boolean) {
        const con = this.connection ? this.connection : await this.connectionManager.getConnection(writable);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `Get connection. used existing connection: ${!!this.connection}`);
        }
        return con;
    }
    public getQueryResultParser(command: IQueryExpression, queryBuilder: IQueryBuilder): IQueryResultParser {
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

    //#endregion

    //#region Update
    public async saveChanges(options?: IQueryOption): Promise<number> {
        const insertQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult>>> = new Map();
        const updateQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult>>> = new Map();
        const deleteQueries: Map<IEntityMetaData, Array<DeferredQuery<IQueryResult>>> = new Map();
        const relationDeleteQueries: Map<IRelationMetaData, Array<DeferredQuery<IQueryResult>>> = new Map();
        const relationAddQueries: Map<IRelationMetaData, Array<DeferredQuery<IQueryResult>>> = new Map();

        // order by priority
        const orderedEntityAdd = Enumerable.from(this.entityEntries.add).orderBy([(o) => o[0].priority, "ASC"]).toMap((o) => o[0], (o) => o[1]);
        const orderedEntityUpdate = Enumerable.from(this.entityEntries.update).orderBy([(o) => o[0].priority, "ASC"]).toMap((o) => o[0], (o) => o[1]);
        const orderedEntityDelete = Enumerable.from(this.entityEntries.delete).orderBy([(o) => o[0].priority, "DESC"]).toMap((o) => o[0], (o) => o[1]);
        const orderedRelationAdd = Enumerable.from(this.relationEntries.add).orderBy([(o) => o[0].source.priority, "ASC"]).toMap((o) => o[0], (o) => o[1]);
        const orderedRelationDelete = Enumerable.from(this.relationEntries.delete).orderBy([(o) => o[0].source.priority, "DESC"]).toMap((o) => o[0], (o) => o[1]);

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
        const getEventEmitter = <T>(entityMeta: IEntityMetaData<T>, ...eventHandlers: Array<IDBEventListener<T>>) => {
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

        // generate add relation here.
        for (const [relMetaData, addEntries] of orderedRelationAdd) {
            relationAddQueries.set(relMetaData, this.getRelationAddQueries(relMetaData, addEntries, visitor));
        }

        // generate remove relation here.
        for (const [relMetaData, deleteEntries] of orderedRelationDelete) {
            // if it relation entity is not yet persisted/tracked, then this relation not valid, so skip
            const entries = deleteEntries.where((o) => o.masterEntry.state !== EntityState.Detached && o.slaveEntry.state !== EntityState.Detached);
            relationDeleteQueries.set(relMetaData, this.getRelationDeleteQueries(relMetaData, entries));
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

        const identityInsertQueries = Enumerable.from(insertQueries).where((o) => o[0].hasIncrementPrimary);
        const nonIdentityInsertQueries = Enumerable.from(insertQueries).where((o) => !o[0].hasIncrementPrimary);

        // execute all in transaction;
        await this.transaction(async () => {
            const allInsertQueries = identityInsertQueries.union(nonIdentityInsertQueries, true).union(Enumerable.from(relationAddQueries).select((o) => [o[0].source, o[1]] as [IEntityMetaData, DeferredQuery[]]), true);
            allInsertQueries.enableCache = true;
            // execute all identity insert queries
            let i = 0;
            for (const [entityMeta, queries] of identityInsertQueries) {
                await this.executeDeferred(queries);

                i++;
                const values = queries.selectMany((o) => o.value.rows).toArray();
                const transformer = new ExpressionExecutor(values);
                for (const dQ of allInsertQueries.skip(i).selectMany((o) => o[1])) {
                    for (const [k, p] of Enumerable.from(dQ.parameters).where(([, param]) => param.name === entityMeta.name)) {
                        p.value = transformer.execute(k.valueExp);
                    }
                }
            }

            const allQueries = nonIdentityInsertQueries.selectMany((o) => o[1])
                .union(Enumerable.from(updateQueries).selectMany((o) => o[1]), true)
                .union(Enumerable.from(relationAddQueries).selectMany((o) => o[1]), true)
                .union(Enumerable.from(relationDeleteQueries).selectMany((o) => o[1]), true)
                .union(Enumerable.from(deleteQueries).selectMany((o) => o[1]), true);

            await this.executeDeferred(allQueries);

            // update all generated value from database. ex: identity, default, etc...
            for (const [entityMeta, queries] of insertQueries) {
                const eventEmitter = getEventEmitter(entityMeta, this);
                let insertedData: IterableIterator<any> = null;
                if (entityMeta.insertGeneratedColumns.any()) {
                    insertedData = queries.selectMany((o) => o.value.rows)[Symbol.iterator]();
                }

                const entityEntries = orderedEntityAdd.get(entityMeta);
                for (const entityEntry of entityEntries) {
                    if (insertedData) {
                        const data = insertedData.next().value;
                        for (const prop in data) {
                            const column = entityMeta.columns.first((o) => o.columnName === prop);
                            if (column) {
                                entityEntry.entity[prop] = this.queryBuilder.toPropertyValue(data[prop], column);
                            }
                        }
                    }
                    entityEntry.acceptChanges();
                    eventEmitter.emitAfterSaveEvent({ type: "insert" }, entityEntry);
                }
            }

            // update all relation changes
            // Note: toArray coz acceptChanges will modify source array.
            const savedRelations = Enumerable.from(() => orderedRelationAdd.values())
                .union(Enumerable.from(() => orderedRelationDelete.values()))
                .selectMany((o) => o)
                .where((o) => o.masterEntry.state !== EntityState.Detached && o.slaveEntry.state !== EntityState.Detached)
                .toArray();

            for (const relEntry of savedRelations) {
                relEntry.acceptChanges();
            }

            // accept update changes.
            for (const [entityMeta, queries] of updateQueries) {
                const eventEmitter = getEventEmitter(entityMeta, this);
                const dbSet = this.set(entityMeta.type);
                const updateData = queries.selectMany((o) => o.value.rows).toMap((o) => dbSet.getKey(o), (o) => o);
                const entityEntries = orderedEntityUpdate.get(entityMeta);
                for (const entityEntry of entityEntries) {
                    const data = updateData.get(entityEntry.key);
                    if (data) {
                        for (const prop in data) {
                            const column = entityMeta.columns.first((o) => o.columnName === prop);
                            if (column) {
                                entityEntry.entity[prop] = this.queryBuilder.toPropertyValue(data[prop], column);
                            }
                        }
                    }
                    entityEntry.acceptChanges();
                    eventEmitter.emitAfterSaveEvent({ type: "update" }, entityEntry);
                }
            }

            // accept delete changes.
            for (const [entityMeta] of deleteQueries) {
                const eventEmitter = getEventEmitter(entityMeta, this);
                const entityEntries = orderedEntityDelete.get(entityMeta);
                const deleteParam: IDeleteEventParam = {
                    type: deleteMode ? deleteMode : entityMeta.deletedColumn ? "soft" : "hard"
                };
                for (const entry of entityEntries) {
                    entry.acceptChanges();
                    eventEmitter.emitAfterDeleteEvent(deleteParam, entry);
                }
            }
        });

        const deferreds = Enumerable.from(() => insertQueries.values())
            .union(Enumerable.from(() => updateQueries.values()), true)
            .union(Enumerable.from(() => relationAddQueries.values()), true)
            .union(Enumerable.from(() => relationDeleteQueries.values()), true)
            .union(Enumerable.from(() => deleteQueries.values()), true);

        return deferreds.selectMany((o) => o).sum((o) => o.value.effectedRows);
    }

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
    protected getDeleteQueries<T>(entityMeta: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, deleteMode?: DeleteMode, option?: IQueryOption): Array<DeferredQuery<IQueryResult>> {
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (!entries.any()) {
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
                    const parameter = new SqlParameterExpression(new ParameterExpression("", col.type), col.columnMeta);
                    queryParameters.set(parameter, { value: entry.entity[col.propertyName] });

                    const logicalExp = new StrictEqualExpression(col, parameter);
                    primaryExp = primaryExp ? new AndExpression(primaryExp, logicalExp) : logicalExp;
                }
                whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
            }
        }
        else {
            const arrayValue = new ArrayValueExpression();
            const primaryKey = entityExp.primaryColumns.first();
            for (const entry of entries) {
                const parameter = new SqlParameterExpression(new ParameterExpression("", primaryKey.type), primaryKey.columnMeta);
                queryParameters.set(parameter, { value: entry.entity[primaryKey.propertyName] });
                arrayValue.items.push(parameter);
            }
            whereExp = new MethodCallExpression(arrayValue, "contains", entityExp.primaryColumns);
        }

        if (whereExp) {
            deleteExp.addWhere(whereExp);
            deleteExp.paramExps = Array.from(queryParameters.keys());
            const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (queryRes) => {
                return {
                    effectedRows: queryRes.sum((o) => o.effectedRows),
                    rows: []
                };
            }, option);
            results.push(deleteQuery);
        }
        return results;
    }
    protected getInsertQueries<T>(entityMeta: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult>> {
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (!entries.any()) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const entityExp = new EntityExpression<T>(entityMeta.type, visitor.newAlias());
        const relations = entityMeta.relations
            .where((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps);
        const columns = relations.selectMany((o) => o.relationColumns)
            .union(entityExp.metaData.columns)
            .except(entityExp.metaData.insertGeneratedColumns).distinct();

        let generatedColumns = entityMeta.insertGeneratedColumns.union(entityMeta.columns.where((o) => !!o.defaultExp));
        const hasGeneratedColumn = generatedColumns.any();
        if (hasGeneratedColumn) {
            generatedColumns = entityMeta.primaryKeys.union(generatedColumns);
        }

        if (entityMeta.hasIncrementPrimary) {
            const queryBuilder = this.queryBuilder;
            // if primary key is auto increment, then need to split all query per entry.
            const incrementColumn = entityMeta.primaryKeys.first((o) => (o as unknown as IntegerColumnMetaData).autoIncrement);
            for (const entry of entries) {
                const insertExp = new InsertExpression(entityExp, []);
                const queryParameters: IQueryParameterMap = new Map();
                insertEntryExp(insertExp, entry, columns, relations, queryParameters);

                const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (queryRes) => {
                    return {
                        effectedRows: queryRes.sum((o) => o.effectedRows),
                        rows: []
                    };
                }, option);
                results.push(insertQuery);

                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = generatedColumns.select((c) => entityExp.columns.first((e) => e.propertyName === c.propertyName)).toArray();

                const lastId = queryBuilder.lastInsertIdQuery;
                selectExp.addWhere(new StrictEqualExpression(entityExp.columns.first((c) => c.propertyName === incrementColumn.columnName), new RawSqlExpression(incrementColumn.type, lastId)));

                const selectQuery = new DeferredQuery(this, selectExp, new Map(), (queryRes) => {
                    return {
                        effectedRows: 0,
                        rows: queryRes.selectMany((o) => o.rows)
                    };
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
                    primaryKey = entityExp.primaryColumns.first();
                }
            }

            for (const entry of entries) {
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

            const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (queryRes) => {
                return {
                    effectedRows: queryRes.sum((o) => o.effectedRows),
                    rows: []
                };
            }, option);
            results.push(insertQuery);

            if (hasGeneratedColumn) {
                if (!isCompositePrimaryKey) {
                    whereExp = new MethodCallExpression(arrayValue, "contains", [primaryKey]);
                }

                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = generatedColumns.select((c) => entityExp.columns.first((e) => e.propertyName === c.propertyName)).toArray();
                selectExp.addWhere(whereExp);

                results.push(new DeferredQuery(this, selectExp, new Map(), (queryRes) => {
                    return {
                        effectedRows: 0,
                        rows: queryRes.selectMany((o) => o.rows)
                    };
                }, option));
            }
        }

        return results;
    }
    protected getRelationAddQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: IEnumerable<RelationEntry<T, T2, TData>>, visitor?: IQueryVisitor, param?: IQueryOption): Array<DeferredQuery<IQueryResult>> {
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (!relationEntries.any()) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const slaveEntityMeta = slaveRelationMetaData.source;
        const masterEntityMeta = slaveRelationMetaData.target;
        const relationDataMeta = slaveRelationMetaData.relationData;
        const entityExp = new EntityExpression(slaveEntityMeta.type, visitor.newAlias());

        const isToOneRelation = slaveRelationMetaData.relationType === "one";
        for (const relationEntry of relationEntries) {
            let dbContext: DbContext = null;
            const masterEntry = relationEntry.masterEntry;
            const slaveEntry = relationEntry.slaveEntry;
            const isMasterAdded = masterEntry.state === EntityState.Added;

            if (isToOneRelation) {
                const queryParameters: IQueryParameterMap = new Map();
                const updateExp = new UpdateExpression(entityExp, {});

                for (const relCol of slaveRelationMetaData.relationColumns) {
                    let sqlParam = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    if (isMasterAdded && (relCol.generation & ColumnGeneration.Insert)) {
                        if (!dbContext) {
                            dbContext = masterEntry.dbSet.dbContext;
                        }
                        const index = dbContext.entityEntries.add.get(masterEntityMeta).indexOf(masterEntry);
                        sqlParam = new SqlParameterExpression(new MemberAccessExpression(new ParameterExpression(index.toString(), masterEntityMeta.type), relCol.columnName as keyof T2), relCol);
                        queryParameters.set(sqlParam, { name: masterEntityMeta.name });
                    }
                    else {
                        const reverseProperty = slaveRelationMetaData.relationMaps.get(relCol).propertyName;
                        queryParameters.set(sqlParam, { value: masterEntry.entity[reverseProperty as keyof T2] });
                    }
                    updateExp.setter[relCol.propertyName] = sqlParam;
                }

                for (const col of entityExp.primaryColumns) {
                    const paramExp = getEntryColumnParam(slaveEntry, col, queryParameters);
                    updateExp.addWhere(new StrictEqualExpression(col, paramExp));
                }

                updateExp.paramExps = Array.from(queryParameters.keys());
                const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (queryRes) => {
                    return {
                        effectedRows: queryRes.sum((o) => o.effectedRows),
                        rows: []
                    };
                }, param);
                results.push(updateQuery);
            }
            else {
                const isSlaveAdded = slaveEntry.state === EntityState.Added;
                const insertExp = new InsertExpression(new EntityExpression(relationDataMeta.type, visitor.newAlias()), []);
                const queryParameters: IQueryParameterMap = new Map();

                const itemExp: { [key: string]: IExpression } = {};
                for (const relCol of relationDataMeta.sourceRelationColumns) {
                    const masterCol = relationDataMeta.sourceRelationMaps.get(relCol) as IColumnMetaData<T2>;
                    let sqlParam = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    if (isMasterAdded && (masterCol.generation & ColumnGeneration.Insert)) {
                        if (!dbContext) {
                            dbContext = masterEntry.dbSet.dbContext;
                        }
                        const index = dbContext.entityEntries.add.get(masterEntityMeta).indexOf(masterEntry);
                        const masterLookupParamExp = new ParameterExpression(index.toString(), masterEntityMeta.type);
                        sqlParam = new SqlParameterExpression(new MemberAccessExpression(masterLookupParamExp, masterCol.columnName as keyof T2), relCol);
                        queryParameters.set(sqlParam, { name: masterEntityMeta.name });
                    }
                    else {
                        queryParameters.set(sqlParam, { value: masterEntry.entity[masterCol.propertyName] });
                    }
                    itemExp[relCol.propertyName] = sqlParam;
                }

                for (const relCol of relationDataMeta.targetRelationColumns.except(relationDataMeta.sourceRelationColumns)) {
                    const slaveCol = relationDataMeta.targetRelationMaps.get(relCol) as IColumnMetaData<T>;
                    let sqlParam = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    if (isSlaveAdded && (slaveCol.generation & ColumnGeneration.Insert)) {
                        if (!dbContext) {
                            dbContext = slaveEntry.dbSet.dbContext;
                        }
                        const index = dbContext.entityEntries.add.get(slaveEntityMeta).indexOf(slaveEntry);
                        sqlParam = new SqlParameterExpression(new MemberAccessExpression(new ParameterExpression(index.toString(), slaveEntityMeta.type), slaveCol.columnName as keyof T), relCol);
                        queryParameters.set(sqlParam, { name: slaveEntityMeta.name });
                    }
                    else {
                        queryParameters.set(sqlParam, { value: slaveEntry.entity[slaveCol.propertyName] });
                    }
                    itemExp[relCol.propertyName] = sqlParam;
                }

                insertExp.values.push(itemExp);
                insertExp.paramExps = Array.from(queryParameters.keys());
                const insertQuery = new DeferredQuery(this, insertExp, queryParameters, (queryRes) => {
                    return {
                        effectedRows: 0,
                        rows: queryRes.selectMany((o) => o.rows)
                    };
                }, param);
                results.push(insertQuery);
            }
        }

        return results;
    }
    protected getRelationDeleteQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: IEnumerable<RelationEntry<T, T2, TData>>, visitor?: IQueryVisitor, param?: IQueryOption): Array<DeferredQuery<IQueryResult>> {
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (!relationEntries.any()) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const isManyToMany = slaveRelationMetaData.relationType === "many";
        const relationDataMeta = slaveRelationMetaData.relationData;

        if (!isManyToMany) {
            // only process relation with not deleted slave entity.
            relationEntries = relationEntries.where((o) => o.slaveEntry.state !== EntityState.Deleted);

            const slaveMetadata = slaveRelationMetaData.source;
            const slaveEntity = new EntityExpression(slaveMetadata.type, visitor.newAlias());
            const slaveSelect = new SelectExpression(slaveEntity);

            const queryParameters: IQueryParameterMap = new Map();
            const slaveHasCompositeKeys = slaveMetadata.primaryKeys.length > 1;
            let whereExp: IExpression<boolean>;
            if (!slaveHasCompositeKeys) {
                const arrayExp = new ArrayValueExpression();
                const primaryCol = slaveEntity.primaryColumns.first();
                for (const entry of relationEntries) {
                    const paramExp = getEntryColumnParam(entry.slaveEntry, primaryCol, queryParameters);
                    arrayExp.items.push(paramExp);
                }
                whereExp = new MethodCallExpression(arrayExp, "contains", slaveEntity.primaryColumns);
            }
            else {
                for (const entry of relationEntries) {
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

                dataDeleteExp.paramExps = Array.from(queryParameters.keys());
                const dataDeleteQuery = new DeferredQuery(this, dataDeleteExp, queryParameters, (queryRes) => {
                    return {
                        effectedRows: queryRes.sum((o) => o.effectedRows),
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
                updateExp.paramExps = Array.from(queryParameters.keys());
                const updateQuery = new DeferredQuery(this, updateExp, queryParameters, (queryRes) => {
                    return {
                        effectedRows: queryRes.sum((o) => o.effectedRows),
                        rows: []
                    };
                }, param);
                results.push(updateQuery);
            }
            else {
                // delete slave entity
                const deleteExp = new DeleteExpression(slaveSelect);
                deleteExp.paramExps = Array.from(queryParameters.keys());
                const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (queryRes) => {
                    return {
                        effectedRows: queryRes.sum((o) => o.effectedRows),
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
            const queryParameters: IQueryParameterMap = new Map();
            let whereExp: IExpression<boolean>;
            for (const relEntry of relationEntries) {
                let primaryExp: IExpression<boolean>;
                for (const [relCol, masterCol] of relationDataMeta.sourceRelationMaps) {
                    const relColExp = dataEntityExp.columns.first((o) => o.propertyName === relCol.propertyName);
                    const sqlParam = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    queryParameters.set(sqlParam, { value: relEntry.masterEntry.entity[masterCol.propertyName as keyof T2] });
                    const logicalExp = new AndExpression(relColExp, sqlParam);
                    primaryExp = primaryExp ? new AndExpression(logicalExp, primaryExp) : logicalExp;
                }

                for (const [relCol, slaveCol] of relationDataMeta.targetRelationMaps) {
                    if (relationDataMeta.sourceRelationColumns.contains(relCol)) {
                        continue;
                    }

                    const relColExp = dataEntityExp.columns.first((o) => o.propertyName === relCol.propertyName);
                    const paramExp = new SqlParameterExpression(new ParameterExpression("", relCol.type), relCol);
                    queryParameters.set(paramExp, { value: relEntry.slaveEntry.entity[slaveCol.propertyName as keyof T] });
                    const logicalExp = new AndExpression(relColExp, paramExp);
                    primaryExp = primaryExp ? new AndExpression(logicalExp, primaryExp) : logicalExp;
                }
                whereExp = whereExp ? new OrExpression(whereExp, primaryExp) : primaryExp;
            }

            const deleteExp = new DeleteExpression(dataEntityExp, new ValueExpression<DeleteMode>("hard"));
            deleteExp.addWhere(whereExp);
            deleteExp.paramExps = Array.from(queryParameters.keys());
            const deleteQuery = new DeferredQuery(this, deleteExp, queryParameters, (queryRes) => {
                return {
                    effectedRows: queryRes.sum((o) => o.effectedRows),
                    rows: []
                };
            }, param);
            results.push(deleteQuery);
        }

        return results;
    }
    protected getUpdateQueries<T>(entityMetaData: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, option?: IQueryOption): Array<DeferredQuery<IQueryResult>> {
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (!entries.any()) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }

        const entityExp = new EntityExpression(entityMetaData.type, visitor.newAlias());

        const autoUpdateColumns = entityMetaData.updateGeneratedColumns.asEnumerable();
        const hasUpdateColumn = autoUpdateColumns.any();
        let selectExp: SelectExpression<T>;
        const selectParameters: IQueryParameterMap = new Map();
        if (hasUpdateColumn) {
            selectExp = new SelectExpression(entityExp);
            selectExp.selects = entityMetaData.primaryKeys.union(autoUpdateColumns).select((o) => entityExp.columns.first((c) => c.propertyName === o.propertyName)).toArray();
        }

        for (const entry of entries) {
            const updateExp = new UpdateExpression(entityExp, {});
            const queryParameters: IQueryParameterMap = new Map();

            let pkFilter: IExpression<boolean>;
            for (const colExp of updateExp.entity.primaryColumns) {
                const parameter = new SqlParameterExpression(new ParameterExpression("", colExp.type), colExp.columnMeta);
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
                const effectedRows = queryRes.sum((o) => o.effectedRows);
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
            const selectQuery = new DeferredQuery(this, selectExp, selectParameters, (queryRes) => {
                return {
                    effectedRows: 0,
                    rows: queryRes.selectMany((o) => o.rows)
                };
            }, option);
            results.push(selectQuery);
        }

        return results;
    }
    protected getUpsertQueries<T>(entityMeta: IEntityMetaData<T>, entries: IEnumerable<EntityEntry<T>>, visitor?: IQueryVisitor, param?: IQueryOption): Array<DeferredQuery<IQueryResult>> {
        const results: Array<DeferredQuery<IQueryResult>> = [];
        if (!entries.any()) {
            return results;
        }

        if (!visitor) {
            visitor = this.queryVisitor;
        }
        const entityExp = new EntityExpression<T>(entityMeta.type, visitor.newAlias());
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

        for (const entry of entries) {
            const upsertExp = new UpsertExpression(entityExp, {});
            upsertExp.updateColumns = entry.state === EntityState.Added ? entityExp.columns.where((o) => !o.isPrimary).toArray() : entityExp.columns.where((o) => !o.isPrimary && entry.isPropertyModified(o.propertyName)).toArray();

            const queryParameters: IQueryParameterMap = new Map();
            upsertEntryExp(upsertExp, entry, queryParameters);

            const upsertQuery = new DeferredQuery(this, upsertExp, queryParameters, (queryRes) => {
                return {
                    effectedRows: queryRes.max((o) => o.effectedRows),
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
            selectExp.selects = generatedColumns.select((c) => entityExp.columns.first((e) => e.propertyName === c.propertyName)).toArray();
            selectExp.addWhere(whereExp);

            results.push(new DeferredQuery(this, selectExp, new Map(results.selectMany((o) => o.parameters).toArray()), (queryRes) => {
                return {
                    effectedRows: 0,
                    rows: queryRes.selectMany((o) => o.rows)
                };
            }, param));
        }

        return results;
    }
    //#endregion
}

const getEntryColumnParam = <T>(entry: EntityEntry<T>, colExp: IColumnExpression<T>, queryParameters: IQueryParameterMap) => {
    const paramExp = new SqlParameterExpression(new ParameterExpression("", colExp.type), colExp.columnMeta);
    queryParameters.set(paramExp, { value: entry.entity[colExp.propertyName] });
    return paramExp;
};
