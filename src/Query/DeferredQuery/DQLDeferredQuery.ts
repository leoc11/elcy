import { IQueryCache } from "../../Cache/IQueryCache";
import { Defer } from "../../Common/Defer";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { Diagnostic } from "../../Logger/Diagnostic";
import { Queryable } from "../../Queryable/Queryable";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SqlTableValueParameterExpression } from "../../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { IQuery } from "../IQuery";
import { IQueryResult } from "../IQueryResult";
import { IQueryResultsParser } from "../IQueryResultsParser";
import { IQueryVisitor } from "../IQueryVisitor";
import { DeferredQuery } from "./DeferredQuery";

export abstract class DQLDeferredQuery<T = any> extends DeferredQuery<T> {
    public get queries() {
        if (!this._queries) {
            const tvpMap = new Map<SqlTableValueParameterExpression, any[]>();
            const queries = this.queryCache.queryTemplates
                .select((o) => this.toQuery(o, this.queryable.stackTree, tvpMap))
                .toArray();

            this._queries = this.tvpQueries(tvpMap, queries);
        }
        return this._queries;
    }
    public get entities() {
        return this.queryCache.entities;
    }
    protected get queryCache() {
        if (!this._queryCache) {
            this._queryCache = this.getQueryCache();
        }
        return this._queryCache;
    }
    protected get queryCacheKey() {
        if (!this._queryCacheKey) {
            const timer = Diagnostic.timer();
            this._queryCacheKey = this.getQueryCacheKey();

            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${this._queryCacheKey}. build cache key time: ${timer.lap()}ms`);
            }
        }
        return this._queryCacheKey;
    }
    constructor(
        public readonly queryable: Queryable
    ) {
        super(queryable.dbContext, queryable.queryOption);
    }
    public defer: Defer<T>;
    public value: T;
    private _queries: IQuery[];
    private _queryCache: IQueryCache<T>;
    private _queryCacheKey: number;
    private _hashCode: number;
    public hashCode(): number {
        if (!this._hashCode) {
            this._hashCode = this.getQueryCacheKey() + this.queries.selectMany((o) => o.parameters).select((o) => hashCode((o[1].value || "NULL").toString())).sum();
        }
        return this._hashCode;
    }
    protected resultParser(result: IQueryResult[], queries?: IQuery[]) {
        return this.queryCache.resultParser(result, queries, this.dbContext);
    }
    protected getQueryCache() {
        let queryCache: IQueryCache<T>;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache && cacheManager && this.queryCacheKey) {
            queryCache = cacheManager.get<T>(this.queryCacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${this.queryCacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            const queryExp = this.buildQuery(visitor);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }
            const templates = this.dbContext.queryBuilder.toQuery(queryExp, this.queryOption);
            queryCache = {
                queryTemplates: templates,
                resultParser: this.getResultParser(queryExp),
                entities: queryExp.getEffectedEntities()
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(this.queryCacheKey, queryCache);
            }
        }

        return queryCache;
    }
    protected abstract getResultParser(queryExp: QueryExpression): IQueryResultsParser<T>;
    protected abstract buildQuery(visitor: IQueryVisitor): QueryExpression;
    protected getQueryCacheKey() {
        let cacheKey = this.queryable.hashCode();
        if (this.queryOption.includeSoftDeleted) {
            cacheKey = hashCodeAdd(cacheKey, 1);
        }
        return cacheKey;
    }
}
