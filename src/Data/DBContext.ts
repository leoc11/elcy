import { IObjectType } from "../Common/Type";
import { DbSet } from "./DbSet";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { EntityBase } from "../Data/EntityBase";
import { IQueryResultParser } from "../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryCacheManager } from "../QueryBuilder/IQueryCacheManager";
import { DefaultQueryCacheManager } from "../QueryBuilder/DefaultQueryCacheManager";
import { IConnectionOption } from "./Interface/IConnectionOption";
import { QueryCache } from "../QueryBuilder/QueryCache";
import { IQueryResult } from "../QueryBuilder/QueryResult";
import { ParameterBuilder } from "../QueryBuilder/ParameterBuilder/ParameterBuilder";

export abstract class DbContext {
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
    public set<T extends EntityBase>(type: IObjectType<T>, isClearCache = false): DbSet<T> {
        let result: DbSet<T> = isClearCache ? undefined as any : this.cachedDbSets.get(type);
        if (!result && this.entityTypes.contains(type)) {
            result = new DbSet(type, this);
            this.cachedDbSets.set(type, result);
        }
        return result;
    }
    public addedEntities: any[];
    public removedEntities: any[];
    public modifedEntities: any[];
}
