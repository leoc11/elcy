import { GenericType } from "../Common/Type";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { DbContext } from "../Data/DBContext";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode, clone } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { DeferredQuery } from "../QueryBuilder/DeferredQuery";
import { IQueryOption } from "../QueryBuilder/Interface/ISelectQueryOption";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { IBuildResult } from "./IBuildResult";
import { ParameterBuilder } from "../QueryBuilder/ParameterBuilder/ParameterBuilder";
import { UpdateExpression } from "./QueryExpression/UpdateExpression";

export abstract class Queryable<T = any> {
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    public options: IQueryOption = { parameters: {} };
    public parameter(params: { [key: string]: any }) {
        Object.assign(this.options.parameters, params);
        return this;
    }
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
        }
    }
    public abstract buildQuery(queryBuilder: QueryBuilder): IBuildResult<T>;
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
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            const buildResult = this.buildQuery(queryBuilder);
            console.log(`build query expression time: ${Date.now() - n}`);
            queryCache = {
                commandQuery: buildResult.expression,
                parameterBuilder: new ParameterBuilder(buildResult.sqlParameters),
                resultParser: new this.dbContext.queryParser(buildResult)
            };
            cacheManager.set(cacheKey, queryCache);
        }
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        return queryCache.commandQuery.toString(queryBuilder);
    }
    public async toArray(): Promise<T[]> {
        const query = this.defferedToArray();
        return await query.execute();
    }
    public async count() {
        const query = this.defferedCount();
        return await query.execute();
    }
    public async contains(item: T) {
        const query = this.defferedContains(item);
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
        const query = this.defferedUpdate(setter);
        return await query.execute();
    }
    public async delete(predicate?: (item: T) => boolean, forceHardDelete = false) {
        const query = this.defferedDelete(predicate, forceHardDelete);
        return await query.execute();
    }
    //#endregion

    //#region Deffered
    public defferedToArray() {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, this.hashCode());
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            const buildResult = this.buildQuery(queryBuilder);
            console.log(`build query expression time: ${Date.now() - n}`);
            queryCache = {
                commandQuery: buildResult.expression,
                parameterBuilder: new ParameterBuilder(buildResult.sqlParameters),
                resultParser: new this.dbContext.queryParser(buildResult)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params, (result) => queryCache.resultParser.parse(result, this.dbContext));
        return query;
    }
    public defferedCount() {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("COUNT", this.hashCode()));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<number>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const methodExpression = new MethodCallExpression(buildResult.expression, "count", []);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
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
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(buildResult.expression, "sum", metParams);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
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
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(buildResult.expression, "max", metParams);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
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
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(buildResult.expression, "min", metParams);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
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
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(buildResult.expression, "avg", metParams);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
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
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(buildResult.expression, "all", metParams);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => !result.first().rows.any());
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
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(buildResult.expression, "any", metParams);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => result.first().rows.any());
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
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(buildResult.expression, "first", metParams);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        return query;
    }
    public defferedContains(item: T) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("CONTAINS", hashCode(JSON.stringify(item), this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const methodExpression = new MethodCallExpression(buildResult.expression, "contains", [new ValueExpression(item)]);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => result.first().rows.any());
        return query;
    }
    public defferedUpdate(setter: (item: T) => { [key in keyof T]?: any }) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("UPDATE", this.hashCode()));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type))
                throw new Error(`Only entity supported`);

            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];
            const commandQuery = new UpdateExpression(buildResult.expression, setter);
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(buildResult.sqlParameters)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryBuilder.getBulkUpdateQuery(queryCache.commandQuery as UpdateExpression);
        console.log(`build query time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params, (result) => result.shift().effectedRows);
        return query;
    }
    public defferedDelete(predicate?: (item: T) => boolean, forceHardDelete = false) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("DELETE", this.hashCode()));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilderType();
        queryBuilder.options = clone(this.options, true);
        if (!queryCache) {
            if (!Reflect.getOwnMetadata(entityMetaKey, this.type))
                throw new Error(`Only entity supported`);

            n = Date.now();
            let buildResult = this.buildQuery(queryBuilder);
            buildResult.expression.includes = [];

            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(buildResult.expression, "where", metParams);
            const param: IVisitParameter = { selectExpression: buildResult.expression, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.selectExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: new ParameterBuilder(param.sqlParameters)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.build(this.options.parameters);
        Object.assign(queryBuilder.options.parameters, params);
        const queryCommands = queryBuilder.deleteQueries(queryCache.commandQuery as SelectExpression, params, forceHardDelete ? "Hard" : undefined);
        console.log(`build query time: ${Date.now() - n}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params, (result) => result.shift().effectedRows);
        return query;
    }
    //#endregion
}
