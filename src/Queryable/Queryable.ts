import { IQueryCache } from "../Cache/IQueryCache";
import { DeleteMode, GenericType, IObjectType, ObjectLike, QueryType, ValueType } from "../Common/Type";
import { DbContext } from "../Data/DBContext";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { QueryBuilderError, QueryBuilderErrorCode } from "../Error/QueryBuilderError";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../ExpressionBuilder/Expression/EqualExpression";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { hashCode, hashCodeAdd, isValue } from "../Helper/Util";
import { Diagnostic } from "../Logger/Diagnostic";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { DeferredQuery } from "../Query/DeferredQuery";
import { IQueryOption } from "../Query/IQueryOption";
import { IQueryParameterMap } from "../Query/IQueryParameter";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { DeleteExpression } from "./QueryExpression/DeleteExpression";
import { EntityExpression } from "./QueryExpression/EntityExpression";
import { InsertIntoExpression } from "./QueryExpression/InsertIntoExpression";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { SqlParameterExpression } from "./QueryExpression/SqlParameterExpression";
import { UpdateExpression } from "./QueryExpression/UpdateExpression";

export abstract class Queryable<T = any> {
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    /**
     * parameter that is actually used by current queryable
     */
    public get parameters(): { [key: string]: any } {
        return this.parent ? this.parent.parameters : {};
    }
    public get queryOption(): IQueryOption {
        return this.parent ? this.parent.queryOption : {};
    }
    constructor(public type: GenericType<T>, parent?: Queryable) {
        if (parent) {
            this.parent = parent;
        }
    }
    protected parent: Queryable;
    public async all(predicate: (item: T) => boolean) {
        const query = this.deferredAll(predicate);
        return await query.execute();
    }
    public async any(predicate?: (item: T) => boolean) {
        const query = this.deferredAny(predicate);
        return await query.execute();
    }
    public async avg(selector?: (item: T) => number) {
        const query = this.deferredAvg(selector);
        return await query.execute();
    }

    //#region Get Result

    public buildParameter(queryExp: IQueryExpression, params: { [key: string]: any }): IQueryParameterMap {
        const result: IQueryParameterMap = new Map();
        const valueTransformer = new ExpressionExecutor(params);
        for (const sqlParameter of queryExp.paramExps) {
            const value = valueTransformer.execute(sqlParameter);
            result.set(sqlParameter, { value: value });
        }
        return result;
    }
    public abstract buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T>;
    public async contains(item: T) {
        const query = this.deferredContains(item);
        return await query.execute();
    }
    public async count() {
        const query = this.deferredCount();
        return await query.execute();
    }
    public deferredAll(predicate: (item: T) => boolean) {
        let queryCache: IQueryCache<boolean>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "ALL", hashCode(predicate.toString()));
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<boolean>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse(predicate, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "all", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => !result.first().rows.any(), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredAny(predicate?: (item: T) => boolean) {
        let queryCache: IQueryCache<boolean>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "ANY", predicate ? hashCode(predicate.toString()) : undefined);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<boolean>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse(predicate, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "any", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => result.first().rows.any(), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredAvg(selector?: (item: T) => number) {
        let queryCache: IQueryCache<number>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "AVG", selector ? hashCode(selector.toString()) : undefined);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<number>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse(selector, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "avg", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredContains(item: T) {
        let queryCache: IQueryCache<boolean>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            let paramStr: string;
            if (isValue(item)) {
                paramStr = item.toString();
            }
            else {
                const entityMeta = Reflect.getOwnMetadata(entityMetaKey, this.type) as IEntityMetaData<T>;
                if (entityMeta) {
                    const primaryItem = {} as T;
                    for (const o of entityMeta.primaryKeys) {
                        primaryItem[o.propertyName] = item[o.propertyName];
                    }
                    item = primaryItem;
                }
                paramStr = JSON.stringify(item);
            }
            cacheKey = this.cacheKey(flatParams, "CONTAINS", hashCode(paramStr));
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<boolean>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "contains", [new ValueExpression(item)]);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => result.first().rows.any(), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredCount() {
        let queryCache: IQueryCache<number>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "COUNT");
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<number>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "count", []);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            const queryBuilder = this.dbContext.queryBuilder;
            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredDelete(mode: DeleteMode): DeferredQuery<number>;
    public deferredDelete(predicate?: (item: T) => boolean, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(modeOrPredicate?: DeleteMode | ((item: T) => boolean), mode?: DeleteMode) {
        let queryCache: IQueryCache<T>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;
        let predicate: (item: T) => boolean = null;
        if (modeOrPredicate) {
            if (modeOrPredicate instanceof Function) {
                predicate = modeOrPredicate;
            }
            else {
                mode = modeOrPredicate;
            }
        }

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "DELETE");
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type)) {
                throw new Error(`Only entity supported`);
            }

            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let selectExp = this.buildQuery(visitor) as SelectExpression<T>;

            if (predicate) {
                const metParams = [];
                metParams.push(ExpressionBuilder.parse(predicate, [this.type], this.parameters));
                const methodExpression = new MethodCallExpression(selectExp, "where", metParams);
                const param: IQueryVisitParameter = { selectExpression: selectExp, scope: "queryable" };
                visitor.visit(methodExpression, param);
                selectExp = param.selectExpression;
            }

            const commandQuery = new DeleteExpression(selectExp, new SqlParameterExpression(new ParameterExpression("__deleteMode")));
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (mode) {
            const paramExp = (queryCache.commandQuery as DeleteExpression).deleteMode as SqlParameterExpression;
            params.set(paramExp, { value: mode });
        }
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.sum((o) => o.effectedRows), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredFind(id: ValueType | ObjectLike<T>) {
        const isValueType = isValue(id);
        const dbSet = this.dbContext.set(this.type as any);
        if (!dbSet) {
            throw new QueryBuilderError(QueryBuilderErrorCode.UsageIssue, "Find only support entity queryable");
        }

        const param = new ParameterExpression("o", this.type);
        const paramId = new ParameterExpression("id", id.constructor as any);
        let andExp: IExpression<boolean>;
        if (isValueType) {
            andExp = new EqualExpression(new MemberAccessExpression(param, dbSet.primaryKeys.first().propertyName), paramId);
        }
        else {
            for (const pk of dbSet.primaryKeys) {
                const d = new EqualExpression(new MemberAccessExpression(param, pk.propertyName), new MemberAccessExpression(paramId, pk.propertyName));
                andExp = andExp ? new AndExpression(andExp, d) : d;
            }
        }
        const a = new FunctionExpression(andExp, [param]);
        return this.parameter({ id }).where(a as any).deferredFirst();
    }
    public deferredFirst(predicate?: (item: T) => boolean) {
        let queryCache: IQueryCache<T>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "FIRST", predicate ? hashCode(predicate.toString()) : undefined);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse(predicate, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "first", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => {
                let i = 0;
                result = result.where((o) => (query.queries[i++].type & QueryType.DQL) && true).toArray();
                return queryCache.resultParser.parse(result, this.dbContext).first();
            }, this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredInsertInto<TT>(type: IObjectType<TT>) {
        const targetSet = this.dbContext.set(type);

        let queryCache: IQueryCache<T>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "INSERT");
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type)) {
                throw new Error(`Only entity supported`);
            }

            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            const selectExp = this.buildQuery(visitor) as SelectExpression<T>;
            if (!this.dbContext.entityTypes.contains(selectExp.itemExpression.type as any)) {
                throw new QueryBuilderError(QueryBuilderErrorCode.UsageIssue, `Insert ${selectExp.itemExpression.type.name} not supported`);
            }

            const entityExp = new EntityExpression(targetSet.type, visitor.newAlias());
            const commandQuery = new InsertIntoExpression(entityExp, selectExp);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.sum((o) => o.effectedRows), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredMax(selector?: (item: T) => number) {
        let queryCache: IQueryCache<number>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "MAX", selector ? hashCode(selector.toString()) : undefined);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<number>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse(selector, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "max", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredMin(selector?: (item: T) => number) {
        let queryCache: IQueryCache<number>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "MIN", selector ? hashCode(selector.toString()) : undefined);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<number>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse(selector, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "min", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredSum(selector?: (item: T) => number) {
        let queryCache: IQueryCache<number>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "SUM", selector ? hashCode(selector.toString()) : undefined);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<number>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse(selector, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "sum", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            const queryBuilder = this.dbContext.queryBuilder;
            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    //#endregion

    //#region deferred
    public deferredToArray() {
        let queryCache: IQueryCache<T>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            const commandQuery = this.buildQuery(visitor);
            commandQuery.queryOption = visitor.queryOption;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression. time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => {
                let i = 0;
                result = result.where(() => query.queries[i++].type === QueryType.DQL).toArray();
                return queryCache.resultParser.parse(result, this.dbContext);
            }, this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredToMap<K, V>(keySelector: (item: T) => K, valueSelector?: (item: T) => V) {
        if (!valueSelector) {
            valueSelector = (o: any) => o;
        }

        let queryCache: IQueryCache<{ Key: K, Value: V }>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "MAP", hashCodeAdd(hashCode(keySelector.toString()), hashCode(valueSelector.toString())));
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;

            const paramExp = new ParameterExpression("m");
            const selector = new ObjectValueExpression<{ Key: K, Value: V }>({});
            const keyExp = ExpressionBuilder.parse(keySelector, [this.type], this.parameters);
            const valueExp = ExpressionBuilder.parse(valueSelector, [this.type], this.parameters);
            keyExp.params[0].name = valueExp.params[0].name = paramExp.name;
            selector.object.Key = keyExp.body;
            selector.object.Value = valueExp.body;
            const selectorExp = new FunctionExpression(selector, [paramExp]);

            const methodExpression = new MethodCallExpression(commandQuery, "select", [selectorExp]);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression. time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => {
                let i = 0;
                result = result.where(() => query.queries[i++].type === QueryType.DQL).toArray();
                return queryCache.resultParser.parse(result, this.dbContext).toMap((o) => o.Key, (o) => o.Value);
            }, this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredUpdate(setter: { [key in keyof T]?: T[key] | ((item: T) => ValueType) }) {
        let queryCache: IQueryCache<T>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "UPDATE");
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type)) {
                throw new Error(`Only entity supported`);
            }

            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            const commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];

            const setterExp: { [key in keyof T]?: IExpression<T[key]> } = {};
            for (const prop in setter) {
                const val = setter[prop];
                if (val instanceof Function) {
                    const funcExp = ExpressionBuilder.parse(val as any, [this.type], this.parameters);
                    setterExp[prop] = visitor.visitFunction(funcExp, [commandQuery.getItemExpression()], { selectExpression: commandQuery, scope: "queryable" });
                }
                else {
                    setterExp[prop] = new ValueExpression(val as T[keyof T]);
                }
            }

            const updateExp = new UpdateExpression(commandQuery, setterExp);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: updateExp
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.sum((o) => o.effectedRows), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }

    public async delete(mode: DeleteMode): Promise<number>;
    public async delete(predicate?: (item: T) => boolean, mode?: DeleteMode): Promise<number>;
    public async delete(modeOrPredicate?: DeleteMode | ((item: T) => boolean), mode?: DeleteMode) {
        const query = this.deferredDelete(modeOrPredicate as any, mode);
        return await query.execute();
    }
    public async find(id: ValueType | ObjectLike<T>) {
        const query = this.deferredFind(id);
        return await query.execute();
    }
    public async first(predicate?: (item: T) => boolean) {
        const query = this.deferredFirst(predicate);
        return await query.execute();
    }
    public flatQueryParameter(param: { index: number }): { [key: string]: any } {
        return this.parent ? this.parent.flatQueryParameter(param) : {};
    }
    public abstract hashCode(): number;
    public async insertInto<TT>(type: IObjectType<TT>) {
        const query = this.deferredInsertInto(type);
        return await query.execute();
    }
    public async max(selector?: (item: T) => number) {
        const query = this.deferredMax(selector);
        return await query.execute();
    }
    public async min(selector?: (item: T) => number) {
        const query = this.deferredMin(selector);
        return await query.execute();
    }
    public async sum(selector?: (item: T) => number) {
        const query = this.deferredSum(selector);
        return await query.execute();
    }
    public async toArray(): Promise<T[]> {
        const query = this.deferredToArray();
        return await query.execute();
    }
    public async toMap<K, V>(keySelector: (item: T) => K, valueSelector?: (item: T) => V): Promise<Map<K, V>> {
        const query = this.deferredToMap(keySelector, valueSelector);
        return await query.execute();
    }
    public toString() {
        let queryCache: IQueryCache<T>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            const commandQuery = this.buildQuery(visitor);
            commandQuery.queryOption = visitor.queryOption;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression. time: ${timer.lap()}ms`);
            }

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery, queryBuilder)
            };
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheManager.set(cacheKey, queryCache);
            }
        }

        const params = this.buildParameter(queryCache.commandQuery, flatParams);
        return queryBuilder.toString(queryCache.commandQuery, { parameters: params });
    }
    public async update(setter: { [key in keyof T]?: T[key] | ((item: T) => ValueType) }) {
        const query = this.deferredUpdate(setter);
        return await query.execute();
    }

    private cacheKey(flatParams: { [key: string]: any }, type?: string, addCode?: number) {
        let cacheKey = hashCode(type, this.hashCode());
        if (addCode) {
            cacheKey = hashCodeAdd(cacheKey, addCode);
        }
        let subQueryCacheKey = 0;
        for (const prop in flatParams) {
            const val = flatParams[prop];
            if (val instanceof Queryable) {
                subQueryCacheKey += val.hashCode();
            }
            else if (val instanceof Function) {
                subQueryCacheKey += hashCode(val.toString());
            }
        }

        cacheKey = hashCodeAdd(subQueryCacheKey, cacheKey);
        if (this.queryOption.includeSoftDeleted) {
            cacheKey = hashCodeAdd(cacheKey, 1);
        }
        return cacheKey;
    }
    //#endregion
}

import "./Queryable.partial";
