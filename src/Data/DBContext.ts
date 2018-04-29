import { IObjectType } from "../Common/Type";
import { DbSet } from "./DbSet";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { IQueryResultParser } from "../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryCacheManager } from "../QueryBuilder/IQueryCacheManager";
import { DefaultQueryCacheManager } from "../QueryBuilder/DefaultQueryCacheManager";
import { IConnectionOption } from "./Interface/IConnectionOption";
import { QueryCache } from "../QueryBuilder/QueryCache";
import { IQueryResult } from "../QueryBuilder/QueryResult";
import { ParameterBuilder } from "../QueryBuilder/ParameterBuilder/ParameterBuilder";
import { EntityEntry, EntityState } from "./Interface/IEntityEntry";
import { IDBEventListener } from "./Event/IDBEventListener";
import { ISaveEventParam, IDeleteEventParam } from "../MetaData/Interface";

export abstract class DbContext implements IDBEventListener<any> {
    public abstract readonly entityTypes: Array<IObjectType<any>>;
    public abstract readonly queryBuilder: IObjectType<QueryBuilder>;
    public abstract readonly queryParser: IObjectType<IQueryResultParser>;
    public get database() {
        return this.connectionOptions.database;
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
    public setQueryChache<T>(key: number, query: string, queryParser: IQueryResultParser<T>, parameterBuilder: ParameterBuilder): Promise<void> {
        return this.queryCacheManager.set<T>(this.constructor as any, key, query, queryParser, parameterBuilder);
    }
    public abstract async executeQuery(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    protected readonly connectionOptions: IConnectionOption;
    protected cachedDbSets: Map<IObjectType, DbSet<any>> = new Map();
    constructor(connectionOption: IConnectionOption) {
        this.connectionOptions = connectionOption;
    }
    public set<T>(type: IObjectType<T>, isClearCache = false): DbSet<T> {
        let result: DbSet<T> = isClearCache ? undefined as any : this.cachedDbSets.get(type);
        if (!result && this.entityTypes.contains(type)) {
            result = new DbSet(type, this);
            this.cachedDbSets.set(type, result);
        }
        return result;
    }
    public async saveChanges(): Promise<number> {
        let queries = [];
        const queryBuilder = new this.queryBuilder();
        for (const addEntry of this.addedEntities) {
            queries.push(queryBuilder.getInsertString(addEntry));
        }
        for (const modifedEntry of this.modifiedEntities) {
            queries.push(queryBuilder.getInsertString(modifedEntry));
        }
        for (const removedEntry of this.deletedEntities) {
            queries.push(queryBuilder.getInsertString(removedEntry));
        }
        const result = await this.executeQuery(queries.join(";\n"));
        return result.sum(o => o.effectedRows);
    }
    public attach<T>(entity: T) {
        const set = this.set(entity.constructor as any);
        if (set) {
            return set.attach(entity);
        }
    }
    public entry<T>(entity: T) {
        const set = this.set(entity.constructor as any);
        if (set) {
            return set.entry(entity);
        }
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
            case EntityState.Added:
                this.addedEntities.remove(entityEntry);
                break;
            case EntityState.Deleted:
                this.deletedEntities.remove(entityEntry);
                break;
            case EntityState.Modified:
                this.modifiedEntities.remove(entityEntry);
                break;
            case EntityState.Unchanged:
                break;
        }
        switch (state) {
            case EntityState.Added:
                this.addedEntities.push(entityEntry);
                break;
            case EntityState.Deleted:
                this.deletedEntities.push(entityEntry);
                break;
            case EntityState.Modified:
                this.modifiedEntities.push(entityEntry);
                break;
            case EntityState.Unchanged:
                break;
        }
        entityEntry.state = state;
    }
    public addedEntities: EntityEntry[] = [];
    public deletedEntities: EntityEntry[] = [];
    public modifiedEntities: EntityEntry[] = [];

    // -------------------------------------------------------------------------
    // DB Event Listener
    // -------------------------------------------------------------------------
    public beforeSave?: <T>(entity: T, param: ISaveEventParam) => boolean;
    public beforeDelete?: <T>(entity: T, param: IDeleteEventParam) => boolean;
    public afterLoad?: <T>(entity: T) => void;
    public afterSave?: <T>(entity: T, param: ISaveEventParam) => void;
    public afterDelete?: <T>(entity: T, param: IDeleteEventParam) => void;
}
