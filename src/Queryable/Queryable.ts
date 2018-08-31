import { GenericType, DeleteMode, QueryType } from "../Common/Type";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { DbContext } from "../Data/DBContext";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { hashCode, clone } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { DeferredQuery } from "../QueryBuilder/DeferredQuery";
import { IQueryOption, ISelectQueryOption } from "../QueryBuilder/Interface/IQueryOption";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { UpdateExpression } from "./QueryExpression/UpdateExpression";
import { IQueryCommandExpression } from "./QueryExpression/IQueryCommandExpression";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";
import { DeleteExpression } from "./QueryExpression/DeleteExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { Enumerable } from "../Enumerable/Enumerable";
import { Diagnostic } from "../Logger/Diagnostic";
import { IQueryCache } from "../Cache/IQueryCache";

export abstract class Queryable<T = any> {
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    public queryOption: IQueryOption = {};
    protected parameterStackIndex = 0;
    public flatParameterStacks: { [key: string]: any } = {};
    public parameters: { [key: string]: any } = {};
    public option(option: IQueryOption) {
        for (const prop in option) {
            const value = (option as any)[prop];
            if (value instanceof Object) {
                if (!(this.queryOption as any)[prop])
                    (this.queryOption as any)[prop] = {};
                Object.assign((this.queryOption as any)[prop], value);
            }
            else {
                (this.queryOption as any)[prop] = value;
            }
        }
        return this;
    }
    protected parent: Queryable;
    constructor(public type: GenericType<T>, parent?: Queryable) {
        if (parent) {
            this.parent = parent;
            this.option(this.parent.queryOption);
            this.parameterStackIndex = parent.parameterStackIndex;
            this.flatParameterStacks = parent.flatParameterStacks;
            this.parameters = clone(parent.parameters);
        }
    }
    public abstract buildQuery(queryVisitor: QueryVisitor): IQueryCommandExpression<T>;
    public abstract hashCode(): number;

    //#region Get Result
    public toString() {
        const timer = Diagnostic.timer();

        let cacheKey = hashCode(this.queryOption.buildKey, this.hashCode());
        if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        if (Diagnostic.enabled) {
            Diagnostic.debug(this, `cache key: ${cacheKey}. cache exist: ${!!queryCache}`);
            Diagnostic.trace(this, `find cache time: ${timer.lap()}ms`);
        }
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            const commandQuery = this.buildQuery(visitor);
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);
            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        queryBuilder.parameters = params;
        return queryCache.commandQuery.toString(queryBuilder);
    }
    public async toArray(): Promise<T[]> {
        const query = this.deferredToArray();
        return await query.execute();
    }
    public async count() {
        const query = this.deferredCount();
        return await query.execute();
    }
    public async contains(item: T) {
        const query = this.deferredContains(item);
        return await query.execute();
    }
    public async sum(selector?: (item: T) => number) {
        const query = this.deferredSum(selector);
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
    public async avg(selector?: (item: T) => number) {
        const query = this.deferredAvg(selector);
        return await query.execute();
    }
    public async all(predicate: (item: T) => boolean) {
        const query = this.deferredAll(predicate);
        return await query.execute();
    }
    public async any(predicate?: (item: T) => boolean) {
        const query = this.deferredAny(predicate);
        return await query.execute();
    }
    public async first(predicate?: (item: T) => boolean) {
        const query = this.deferredFirst(predicate);
        return await query.execute();
    }
    public async update(setter: (item: T) => { [key in keyof T]?: any }) {
        const query = this.deferredUpdate(setter);
        return await query.execute();
    }
    public async delete(predicate?: (item: T) => boolean, mode?: DeleteMode) {
        const query = this.deferredDelete(predicate, mode);
        return await query.execute();
    }
    //#endregion

    //#region deferred
    public deferredToArray() {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, this.hashCode());
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            const commandQuery = this.buildQuery(visitor);
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression. time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => {
                let i = 0;
                result = result.where(o => query.queryCommands[i++].type === QueryType.DQL).toArray();
                return queryCache.resultParser.parse(result, this.dbContext);
            }, this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredCount() {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("COUNT", this.hashCode()));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "count", []);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredSum(selector?: (item: T) => number) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("SUM", hashCode(selector ? selector.toString() : "", this.hashCode())));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "sum", metParams);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredMax(selector?: (item: T) => number) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("MAX", hashCode(selector ? selector.toString() : "", this.hashCode())));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "max", metParams);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredMin(selector?: (item: T) => number) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("MIN", hashCode(selector ? selector.toString() : "", this.hashCode())));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "min", metParams);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredAvg(selector?: (item: T) => number) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("AVG", hashCode(selector ? selector.toString() : "", this.hashCode())));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "avg", metParams);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first(), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredAll(predicate: (item: T) => boolean) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("ALL", hashCode(predicate.toString(), this.hashCode())));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "all", metParams);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => Enumerable.load(result.first().rows).any(), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredAny(predicate?: (item: T) => boolean) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("ANY", hashCode(predicate ? predicate.toString() : "", this.hashCode())));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "any", metParams);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery
            };
            cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => Enumerable.load(result.first().rows).any(), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredFirst(predicate?: (item: T) => boolean) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("FIRST", hashCode(predicate ? predicate.toString() : "", this.hashCode())));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(commandQuery, "first", metParams);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => {
                let i = 0;
                result = result.where(o => query.queryCommands[i++].type === QueryType.DQL).toArray();
                return queryCache.resultParser.parse(result, this.dbContext).first();
            }, this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredContains(item: T) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("CONTAINS", hashCode(JSON.stringify(item), this.hashCode())));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "contains", [new ValueExpression(item)]);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => Enumerable.load(result.first().rows).any(), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredUpdate(setter: (item: T) => { [key in keyof T]?: any }) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("UPDATE", this.hashCode()));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type))
                throw new Error(`Only entity supported`);

            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];

            let setterExp = ExpressionBuilder.parse(setter, this.flatParameterStacks);
            visitor.scopeParameters.add(setterExp.params[0].name, commandQuery.getVisitParam());
            let body = setterExp.body as ObjectValueExpression<{ [key in keyof T]: IExpression }>;
            body = visitor.visit(body, { selectExpression: commandQuery, scope: "queryable" }) as any;
            visitor.scopeParameters.remove(setterExp.params[0].name);

            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            const updateExp = new UpdateExpression(commandQuery, body.object);
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: updateExp,
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.shift().effectedRows, this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredDelete(predicate?: (item: T) => boolean, mode?: DeleteMode) {
        let queryCache: IQueryCache<T>, cacheKey: number;
        const timer = Diagnostic.timer();
        const cacheManager = this.dbContext.queryCacheManager;

        if (!this.queryOption.noQueryCache) {
            cacheKey = hashCode(this.queryOption.buildKey, hashCode("DELETE", this.hashCode()));
            if (Diagnostic.enabled) Diagnostic.trace(this, `cache key: ${cacheKey}. build cache key time: ${timer.lap()}ms`);

            let queryCache = cacheManager.get<T>(cacheKey);
            if (Diagnostic.enabled) {
                Diagnostic.debug(this, `find query expression cache with key: ${cacheKey}. cache exist: ${!!queryCache}`);
                Diagnostic.trace(this, `find query expression cache time: ${timer.lap()}ms`);
            }
        }

        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.queryOption, true);
        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type))
                throw new Error(`Only entity supported`);

            const visitor = this.dbContext.queryVisitor;
            let selectExp = this.buildQuery(visitor) as SelectExpression<T>;

            if (predicate) {
                const metParams = [];
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
                const methodExpression = new MethodCallExpression(selectExp, "where", metParams);
                const param: IVisitParameter = { selectExpression: selectExp, scope: "queryable" };
                visitor.visit(methodExpression, param);
                selectExp = param.selectExpression;
            }
            selectExp.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            const commandQuery = new DeleteExpression(selectExp, new ParameterExpression("__deleteMode"));
            if (Diagnostic.enabled) Diagnostic.trace(this, `build query expression time: ${timer.lap()}ms`);

            queryCache = {
                commandQuery: commandQuery,
            };
            if (!this.queryOption.noQueryCache) cacheManager.set(cacheKey, queryCache);
        }

        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (mode) {
            params.push({
                parameter: new SqlParameterExpression("", (queryCache.commandQuery as DeleteExpression).deleteMode),
                value: mode
            });
        }
        if (Diagnostic.enabled) Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.sum(o => o.effectedRows), this.queryOption);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    //#endregion
}
