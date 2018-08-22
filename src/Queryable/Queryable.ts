import { GenericType, DeleteMode } from "../Common/Type";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { DbContext } from "../Data/DBContext";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { hashCode, clone } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { DeferredQuery } from "../QueryBuilder/DeferredQuery";
import { IQueryOption } from "../QueryBuilder/Interface/ISelectQueryOption";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { UpdateExpression } from "./QueryExpression/UpdateExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";
import { DeleteExpression } from "./QueryExpression/DeleteExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { Enumerable } from "../Enumerable/Enumerable";

export abstract class Queryable<T = any> {
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    public options: IQueryOption = {};
    protected parameterStackIndex = 0;
    public flatParameterStacks: { [key: string]: any } = {};
    public parameters: { [key: string]: any } = {};
    public option(option: IQueryOption) {
        for (const prop in option) {
            const value = (option as any)[prop];
            if (value instanceof Object) {
                if (!(this.options as any)[prop])
                    (this.options as any)[prop] = {};
                Object.assign((this.options as any)[prop], value);
            }
            else {
                (this.options as any)[prop] = value;
            }
        }
        return this;
    }
    protected parent: Queryable;
    constructor(public type: GenericType<T>, parent?: Queryable) {
        if (parent) {
            this.parent = parent;
            this.option(this.parent.options);
            this.parameterStackIndex = parent.parameterStackIndex;
            this.flatParameterStacks = parent.flatParameterStacks;
            this.parameters = clone(parent.parameters);
        }
    }
    public abstract buildQuery(queryVisitor: QueryVisitor): ICommandQueryExpression<T>;
    public abstract hashCode(): number;

    //#region Get Result
    public toString() {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, this.hashCode());
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            const visitor = this.dbContext.queryVisitor;
            const commandQuery = this.buildQuery(visitor);
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            console.log(`build query expression time: ${Date.now() - n}`);
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
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, this.hashCode());
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            const visitor = this.dbContext.queryVisitor;
            const commandQuery = this.buildQuery(visitor);
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            console.log(`build query expression time: ${Date.now() - n}`);
            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);
        // const params = queryCache.parameterBuilder.build(this.options.parameters);
        // Object.assign(queryBuilder.options.parameters, params);
        // const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => queryCache.resultParser.parse(result, this.dbContext));
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredCount() {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("COUNT", this.hashCode()));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<number>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "count", []);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredSum(selector?: (item: T) => number) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("SUM", hashCode(selector ? selector.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<number>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredMax(selector?: (item: T) => number) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("MAX", hashCode(selector ? selector.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<number>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredMin(selector?: (item: T) => number) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("MIN", hashCode(selector ? selector.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<number>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredAvg(selector?: (item: T) => number) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("AVG", hashCode(selector ? selector.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<number>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredAll(predicate: (item: T) => boolean) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("ALL", hashCode(predicate.toString(), this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => Enumerable.load(result.first().rows).any());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredAny(predicate?: (item: T) => boolean) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("ANY", hashCode(predicate ? predicate.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => Enumerable.load(result.first().rows).any());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredFirst(predicate?: (item: T) => boolean) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("FIRST", hashCode(predicate ? predicate.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                resultParser: this.dbContext.getQueryResultParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredContains(item: T) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("CONTAINS", hashCode(JSON.stringify(item), this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            const visitor = this.dbContext.queryVisitor;
            let commandQuery = this.buildQuery(visitor) as SelectExpression<T>;
            commandQuery.includes = [];
            const methodExpression = new MethodCallExpression(commandQuery, "contains", [new ValueExpression(item)]);
            const param: IVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
            visitor.visit(methodExpression, param);
            commandQuery = param.selectExpression;
            commandQuery.parameters = visitor.sqlParameters.asEnumerable().select(o => o[1]).toArray();
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params,
            (result) => Enumerable.load(result.first().rows).any());
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredUpdate(setter: (item: T) => { [key in keyof T]?: any }) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("UPDATE", this.hashCode()));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type))
                throw new Error(`Only entity supported`);

            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: updateExp,
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.shift().effectedRows);
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    public deferredDelete(predicate?: (item: T) => boolean, mode?: DeleteMode) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("DELETE", this.hashCode()));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = this.dbContext.queryBuilder;
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type))
                throw new Error(`Only entity supported`);

            n = Date.now();
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
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.commandQuery.buildParameter(this.flatParameterStacks);
        if (mode) {
            params.push({
                parameter: new SqlParameterExpression("", (queryCache.commandQuery as DeleteExpression).deleteMode),
                value: mode
            });
        }
        console.log(`build params time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCache.commandQuery, params, (result) => result.sum(o => o.effectedRows));
        this.dbContext.deferredQueries.add(query);
        return query;
    }
    //#endregion
}
