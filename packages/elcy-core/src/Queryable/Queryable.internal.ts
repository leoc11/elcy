import { Enumerable, IEnumerable } from "@elcy/enumerable";
import { IQueryCache } from "../Cache/IQueryCache";
import { QueryType } from "../Common/Enum";
import { DeleteMode } from "../Common/StringType";
import { FlatObjectLike, GenericType, IObjectType, MethodKey, PrimitiveType, SetterObj, StringKeyOf, ValueType } from "../Common/Type";
import { DbContext } from "../Data/DbContext";
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
import { hashCode, hashCodeAdd, isNotNull, isNull, isValue } from "../Helper/Util";
import { Diagnostic } from "../Logger/Diagnostic";
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
import { getEntityMetadata } from "src/MetaData/MetaDataMapper";
import { QueryableChain, Unchain } from "./Interface/QueryableChain";

export abstract class Queryable<T = any> implements AsyncIterable<T> {
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    /**
     * parameter that is actually used by current queryable
     */
    public get parameters(): { [key: string]: unknown } {
        return this.parent ? this.parent.parameters : {};
    }
    public get queryOption(): IQueryOption {
        return this.parent ? this.parent.queryOption : {};
    }
    constructor(type: PrimitiveType<T>, parent?: Queryable);
    constructor(type: GenericType<T>, parent?: Queryable);
    constructor(public type: GenericType<T>, protected parent?: Queryable) {
        if (parent) {
            this.parent = parent;
        }
    }
    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        yield* await this.toEnumerable();
    }
    public async every(predicate: (item: QueryableChain<T>) => boolean) {
        const query = this.deferredEvery(predicate);
        return await query.execute();
    }
    public async some(predicate?: (item: QueryableChain<T>) => boolean) {
        const query = this.deferredSome(predicate);
        return await query.execute();
    }

    //#region Get Result

    public buildParameter(queryExp: IQueryExpression, params: { [key: string]: unknown }): IQueryParameterMap {
        const result: IQueryParameterMap = new Map();
        const valueTransformer = new ExpressionExecutor(params);
        let paramExps = Enumerable.from(queryExp.paramExps);
        if (Array.isArray(queryExp.includes)) {
            paramExps = paramExps.union(Enumerable.from(queryExp.includes).flatMap(o => o.child.paramExps));
        }
        for (const sqlParameter of paramExps) {
            const value = valueTransformer.execute(sqlParameter);
            result.set(sqlParameter, { value: value });
        }
        return result;
    }
    public abstract buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T>;
    public async includes(item: T) {
        const query = this.deferredIncludes(item);
        return await query.execute();
    }
    public async count() {
        const query = this.deferredCount();
        return await query.execute();
    }
    public deferredEvery(predicate: (item: QueryableChain<T>) => boolean) {
        let queryCache: IQueryCache<boolean>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "EVERY", hashCode(predicate.toString()));
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse(predicate, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "every", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
            (result) => !result.find(() => true).rows.some(() => true), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredSome(predicate?: (item: QueryableChain<T>) => boolean) {
        let queryCache: IQueryCache<boolean>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "SOME", predicate ? hashCode(predicate.toString()) : undefined);
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse(predicate, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "some", metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
            (result) => result.find(() => true).rows.some(() => true), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredIncludes(item: T) {
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
                const entityMeta = getEntityMetadata(this.type as IObjectType<T & object>);
                if (entityMeta) {
                    const primaryItem = {} as T;
                    for (const o of entityMeta.primaryKeys) {
                        primaryItem[o.propertyName] = item[o.propertyName];
                    }
                    item = primaryItem;
                }
                paramStr = JSON.stringify(item);
            }
            cacheKey = this.cacheKey(flatParams, "INCLUDES", hashCode(paramStr));
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "includes", [new ValueExpression(item)]);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
            (result) => result.find(() => true).rows.some(() => true), this.queryOption);
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "count" as MethodKey<T[]>, []);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            }

            const queryBuilder = this.dbContext.queryBuilder;
            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser<number>(commandQuery, queryBuilder)
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
            (result) => queryCache.resultParser.parse(result, this.dbContext).find(() => true), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredDelete(mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(predicate?: FunctionExpression<boolean, [T]>, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(predicate?: (item: QueryableChain<T>) => boolean, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(modeOrPredicate?: DeleteMode | FunctionExpression<boolean, [T]> | ((item: QueryableChain<T>) => boolean), mode?: DeleteMode) {
        let queryCache: IQueryCache<void>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;
        let predicate: FunctionExpression<boolean, [T]> | ((item: QueryableChain<T>) => boolean);
        if (modeOrPredicate) {
            if (modeOrPredicate instanceof FunctionExpression) {
                predicate = modeOrPredicate;
            }
            else if (modeOrPredicate instanceof Function) {
                predicate = modeOrPredicate;
            }
            else {
                mode = modeOrPredicate;
            }
        }

        if (predicate) {
            let q: Queryable<T> = this;
            if (!mode) {
                const entityMeta = getEntityMetadata(this.type as IObjectType<T & object>);
                mode = entityMeta?.deletedColumn ? "soft" : "hard";
            }

            if (mode === "hard") {
                q = q.option({ includeSoftDeleted: true });
            }
            return q.filter(predicate).deferredDelete(mode);
        }

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "DELETE");
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<void>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            if (!getEntityMetadata(this.type as IObjectType<T & object>)) {
                throw new Error(`Only entity supported`);
            }

            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            const selectExp = this.buildQuery(visitor) as SelectExpression<object, T>;

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
            const paramExp = (queryCache.commandQuery as DeleteExpression<object>).deleteMode as SqlParameterExpression;
            params.set(paramExp, { value: mode });
        }
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.reduce((r, o) => r + o.effectedRows, 0), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredFind(idOrPredicate?: ValueType | FlatObjectLike<T> | ((item: QueryableChain<T>) => boolean)): DeferredQuery<T> {
        const predicate = idOrPredicate instanceof Function ? idOrPredicate : undefined;
        const id = isNotNull(idOrPredicate) && !(idOrPredicate instanceof Function) ? idOrPredicate : undefined;
        if (id !== undefined) {
            const isValueType = isValue(id);
            const dbSet = this.dbContext.set(this.type as any);
            if (!dbSet) {
                throw new QueryBuilderError(QueryBuilderErrorCode.UsageIssue, "Find only support entity queryable");
            }

            const param = new ParameterExpression("o", this.type as GenericType<T & object>);
            const paramId = new ParameterExpression("id", id.constructor as GenericType);
            let andExp: IExpression<boolean>;
            if (isValueType) {
                andExp = new EqualExpression(new MemberAccessExpression(param, dbSet.primaryKeys?.[0]?.propertyName), paramId);
            }
            else {
                for (const pk of dbSet.primaryKeys) {
                    const d = new EqualExpression(new MemberAccessExpression(param, pk.propertyName), new MemberAccessExpression(paramId as IExpression<object>, pk.propertyName));
                    andExp = andExp ? new AndExpression(andExp, d) : d;
                }
            }
            const a = new FunctionExpression(andExp, [param]);
            return this.parameter({ id }).filter(a as any).deferredFind();
        }
        else {
            let queryCache: IQueryCache<T>;
            let cacheKey: number;
            const timer = Diagnostic.timer();
            const cacheManager = this.dbContext.queryCacheManager;
            const flatParams = this.flatQueryParameter({ index: 0 });
            if (!this.queryOption.noQueryCache && cacheManager) {
                cacheKey = this.cacheKey(flatParams, "FIND", predicate ? hashCode(predicate.toString()) : undefined);
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
                let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
                const metParams = [];
                if (predicate) {
                    metParams.push(ExpressionBuilder.parse(predicate, [this.type], this.parameters));
                }
                const methodExpression = new MethodCallExpression(commandQuery, "find", metParams);
                const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
                visitor.visit(methodExpression, param);
                commandQuery = param.selectExpression as SelectExpression<object, T>;
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
                    result = result.filter(() => (query.queries[i++].type & QueryType.DQL) && true);
                    return Enumerable.from(queryCache.resultParser.parse(result, this.dbContext)).find();
                }, this.queryOption);
            this.dbContext.deferredQueries.push(query);
            return query;
        }
    }
    public deferredInsertInto<TT extends object>(type: IObjectType<TT>) {
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
            if (!getEntityMetadata(this.type as IObjectType<T & object>)) {
                throw new Error(`Only entity supported`);
            }

            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            const selectExp = this.buildQuery(visitor) as SelectExpression<object, TT>;
            if (!this.dbContext.entityTypes.includes(selectExp.itemExpression.type as IObjectType<TT>)) {
                throw new QueryBuilderError(QueryBuilderErrorCode.UsageIssue, `Insert ${selectExp.itemExpression.type.name} not supported`);
            }

            const entityExp = new EntityExpression(targetSet.type, visitor.newAlias());
            const commandQuery = new InsertIntoExpression<TT>(entityExp, selectExp);
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

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.reduce((r, o) => r + o.effectedRows, 0), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
        let queryCache: IQueryCache<TResult>;
        let cacheKey: number;
        const selector = args[0];
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "MAX", selector ? hashCode(selector.toString()) : undefined);
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<TResult>(cacheKey);
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse(selector, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "max" as MethodKey<T[]>, metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
            (result) => queryCache.resultParser.parse(result, this.dbContext).find(() => true), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredMin(...args: T extends ValueType ? [selector?: (item: QueryableChain<T>) => ValueType] : [selector: (item: QueryableChain<T>) => ValueType]) {
        let queryCache: IQueryCache<T>;
        let cacheKey: number;
        const selector = args[0];
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "MIN", selector ? hashCode(selector.toString()) : undefined);
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse(selector, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "min" as MethodKey<T[]>, metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
            (result) => queryCache.resultParser.parse(result, this.dbContext).find(() => true), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredSum(...args: T extends number ? [selector?: (item: QueryableChain<T>) => number] : [selector: (item: QueryableChain<T>) => number]) {
        let queryCache: IQueryCache<number>;
        let cacheKey: number;
        const selector = args[0];
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse(selector, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "sum" as MethodKey<T[]>, metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
            (result) => queryCache.resultParser.parse(result, this.dbContext).find(() => true), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredAvg(...args: T extends number ? [selector?: (item: QueryableChain<T>) => number] : [selector: (item: QueryableChain<T>) => number]): DeferredQuery<number | null> {
        let queryCache: IQueryCache<number>;
        let cacheKey: number;
        const selector = args[0];
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse(selector, [this.type], this.parameters));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "avg" as MethodKey<T[]>, metParams);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
            (result) => queryCache.resultParser.parse(result, this.dbContext).find(() => true), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredJoin: T extends string ? (separator?: string) => DeferredQuery<string> : never = ((separator: string = ",") => {
        let queryCache: IQueryCache<string>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "JOIN", hashCode(separator));
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<string>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "join", [new ValueExpression(separator)], String);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
            (result) => queryCache.resultParser.parse(result, this.dbContext).find(() => true) ?? "", this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }) as any;
    //#endregion

    //#region deferred
    private deferredToIterable<TResult>(resultParser: (data: IEnumerable<T>) => TResult) {
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
                result = result.filter(() => query.queries[i++].type === QueryType.DQL);
                const data = queryCache.resultParser.parse(result, this.dbContext);
                return resultParser(data);
            }, this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredToEnumerable() {
        return this.deferredToIterable(o => Enumerable.from(o));
    }
    public deferredToArray() {
        return this.deferredToIterable(o => Array.from(o));
    }
    public deferredToSet() {
        return this.deferredToIterable(o => new Set(o));
    }
    public deferredToMap<K, V>(keySelector: (item: QueryableChain<T>) => K, valueSelector?: (item: QueryableChain<T>) => V) {
        if (!valueSelector) {
            valueSelector = (o: QueryableChain<T>) => (o as V);
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
            let commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;

            const paramExp = new ParameterExpression("m");
            const selector = new ObjectValueExpression<{ Key: K, Value: V }>({});
            const keyExp = ExpressionBuilder.parse(keySelector, [this.type], this.parameters);
            const valueExp = ExpressionBuilder.parse(valueSelector, [this.type], this.parameters);
            keyExp.params[0].name = valueExp.params[0].name = paramExp.name;
            selector.object.Key = keyExp.body;
            selector.object.Value = valueExp.body;
            const selectorExp = new FunctionExpression(selector, [paramExp]);

            const methodExpression = new MethodCallExpression(commandQuery, "map", [selectorExp]);
            const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression as SelectExpression<object, T>;
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
                result = result.filter(() => query.queries[i++].type === QueryType.DQL);
                return Enumerable.from(queryCache.resultParser.parse(result, this.dbContext)).toMap((o) => o.Key as Unchain<K>, (o) => o.Value as Unchain<V>);
            }, this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }
    public deferredUpdate(setter: { [TK in keyof T]?: (T[TK] & ValueType) | ((item: QueryableChain<T>) => T[TK] & ValueType) }) {
        let queryCache: IQueryCache<void>;
        let cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        const flatParams = this.flatQueryParameter({ index: 0 });
        if (!this.queryOption.noQueryCache && cacheManager) {
            cacheKey = this.cacheKey(flatParams, "UPDATE");
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);
            }

            queryCache = cacheManager.get<void>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        if (!queryCache) {
            if (!getEntityMetadata(this.type as IObjectType<T & object>)) {
                throw new Error(`Only entity supported`);
            }

            const visitor = this.dbContext.queryVisitor;
            visitor.queryOption = this.queryOption;
            visitor.setParameter(flatParams);
            const commandQuery = this.buildQuery(visitor) as SelectExpression<object, T>;
            commandQuery.includes = [];

            const setterExp: SetterObj<T> = {};
            for (const prop in setter) {
                const val = setter[prop];
                if (val instanceof Function) {
                    const funcExp = ExpressionBuilder.parse(val as (o: unknown) => T[StringKeyOf<T>] & ValueType, [this.type], this.parameters);
                    setterExp[prop] = visitor.visitFunction(funcExp, [commandQuery.getItemExpression()], { selectExpression: commandQuery, scope: "queryable" });
                }
                else {
                    setterExp[prop] = new ValueExpression(val as T[StringKeyOf<T>] & ValueType);
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

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.reduce((r, o) => r + o.effectedRows, 0), this.queryOption);
        this.dbContext.deferredQueries.push(query);
        return query;
    }

    public async delete(mode?: DeleteMode): Promise<number>;
    public async delete(predicate?: FunctionExpression<boolean, [T]>, mode?: DeleteMode): Promise<number>;
    public async delete(predicate?: (item: QueryableChain<T>) => boolean, mode?: DeleteMode): Promise<number>;
    public async delete(modeOrPredicate?: DeleteMode | FunctionExpression<boolean, [T]> | ((item: QueryableChain<T>) => boolean), mode?: DeleteMode) {
        const query = this.deferredDelete(modeOrPredicate as FunctionExpression<boolean, [T]>, mode);
        return await query.execute();
    }
    public async find(predicate?: (item: QueryableChain<T>) => boolean): Promise<T>;
    public async find(id: ValueType | FlatObjectLike<T>): Promise<T>;
    public async find(idOrPredicate?: ValueType | FlatObjectLike<T> | ((item: QueryableChain<T>) => boolean)) {
        const query: DeferredQuery<T> = this.deferredFind(idOrPredicate);
        return await query.execute();
    }
    public flatQueryParameter(param: { index: number }): { [key: string]: unknown } {
        return this.parent ? this.parent.flatQueryParameter(param) : {};
    }
    public abstract hashCode(): number;
    public async insertInto<TT extends object>(type: IObjectType<TT>) {
        const query = this.deferredInsertInto(type);
        return await query.execute();
    }
    public async max(...args: T extends ValueType ? [selector?: (item: QueryableChain<T>) => ValueType] : [selector: (item: QueryableChain<T>) => ValueType]) {
        const query = this.deferredMax(...args);
        return await query.execute();
    }
    public async min(...args: T extends ValueType ? [selector?: (item: QueryableChain<T>) => ValueType] : [selector: (item: QueryableChain<T>) => ValueType]) {
        const query = this.deferredMin(...args);
        return await query.execute();
    }
    public async sum(...args: T extends number ? [selector?: (item: QueryableChain<T>) => number] : [selector: (item: QueryableChain<T>) => number]) {
        const query = this.deferredSum(...args);
        return await query.execute();
    }
    public async avg(...args: T extends number ? [selector?: (item: QueryableChain<T>) => number] : [selector: (item: QueryableChain<T>) => number]): Promise<number | null> {
        const query = this.deferredAvg(...args);
        return await query.execute();
    }
    public join: T extends string ? (separator?: string) => Promise<string> : never = (async (separator: string = ",") => {
        const query = this.deferredJoin(separator);
        return await query.execute();
    }) as any;
    public async toEnumerable(): Promise<Enumerable<T>> {
        const query = this.deferredToEnumerable();
        return await query.execute();
    }
    public async toArray(): Promise<T[]> {
        const query = this.deferredToArray();
        return await query.execute();
    }
    public async toSet(): Promise<Set<T>> {
        const query = this.deferredToSet();
        return await query.execute();
    }
    public async toMap<K>(keySelector: (item: QueryableChain<T>) => K): Promise<Map<Unchain<K>, Unchain<T>>>;
    public async toMap<K, V>(keySelector: (item: QueryableChain<T>) => K, valueSelector: (item: QueryableChain<T>) => V): Promise<Map<Unchain<K>, Unchain<V>>>;
    public async toMap<K, V>(keySelector: (item: QueryableChain<T>) => K, valueSelector?: (item: QueryableChain<T>) => V): Promise<Map<Unchain<K>, Unchain<V>>> {
        const query = this.deferredToMap(keySelector, valueSelector);
        return await query.execute();
    }
    public asSubquery(): Enumerable<T> {
        return this as unknown as Enumerable<T>;
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
    public async update(setter: { [TK in keyof T]?: (T[TK] & ValueType) | ((item: QueryableChain<T>) => T[TK] & ValueType) }) {
        const query = this.deferredUpdate(setter);
        return await query.execute();
    }

    private cacheKey(flatParams: { [key: string]: unknown }, type?: string, addCode?: number) {
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
            else if (val instanceof FunctionExpression) {
                subQueryCacheKey += val.hashCode();
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