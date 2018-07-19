import { GenericType } from "../Common/Type";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { DbContext } from "../Data/DBContext";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { DeferredQuery } from "../QueryBuilder/DeferredQuery";
import { IQueryOption } from "../QueryBuilder/Interface/ISelectQueryOption";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";

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
    public abstract buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<T>;
    public abstract hashCode(): number;
    public toString() {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, this.hashCode());
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            const commandQuery = this.buildQuery(queryBuilder);
            console.log(`build query expression time: ${Date.now() - n}`);
            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder(),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        return queryCache.commandQuery.toString(queryBuilder);
    }
    public async toArray(): Promise<T[]> {
        const query = await this.defferedToArray();
        return await query.execute();
    }
    public async count() {
        const query = await this.defferedCount();
        return await query.execute();
    }
    public async contains(item: T) {
        const query = await this.defferedContains(item);
        return await query.execute();
    }
    public async sum(selector?: (item: T) => number) {
        const query = await this.deferredSum(selector);
        return await query.execute();
    }
    public async max(selector?: (item: T) => number) {
        const query = await this.deferredMax(selector);
        return await query.execute();
    }
    public async min(selector?: (item: T) => number) {
        const query = await this.deferredMin(selector);
        return await query.execute();
    }
    public async avg(selector?: (item: T) => number) {
        const query = await this.deferredAvg(selector);
        return await query.execute();
    }
    public async all(predicate: (item: T) => boolean) {
        const query = await this.deferredAll(predicate);
        return await query.execute();
    }
    public async any(predicate?: (item: T) => boolean) {
        const query = await this.deferredAny(predicate);
        return await query.execute();
    }
    public async first(predicate?: (item: T) => boolean) {
        const query = await this.deferredFirst(predicate);
        return await query.execute();
    }
    public async defferedToArray() {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, this.hashCode());
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            const commandQuery = this.buildQuery(queryBuilder);
            console.log(`build query expression time: ${Date.now() - n}`);
            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder(),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params, (result) => queryCache.resultParser.parse(result, this.dbContext));
        return query;
    }
    public async defferedCount() {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("COUNT", this.hashCode()));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            expression.includes = [];
            const methodExpression = new MethodCallExpression(expression, "count", []);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder(),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        return query;
    }
    public async deferredSum(selector?: (item: T) => number) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("SUM", hashCode(selector ? selector.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(expression, "sum", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder(),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        return query;
    }
    public async deferredMax(selector?: (item: T) => number) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("MAX", hashCode(selector ? selector.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(expression, "max", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder(),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        return query;
    }
    public async deferredMin(selector?: (item: T) => number) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("MIN", hashCode(selector ? selector.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(expression, "min", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder(),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        return query;
    }
    public async deferredAvg(selector?: (item: T) => number) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("AVG", hashCode(selector ? selector.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector));
            }
            const methodExpression = new MethodCallExpression(expression, "avg", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder(),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        return query;
    }
    public async deferredAll(predicate: (item: T) => boolean) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("ALL", hashCode(predicate.toString(), this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            expression.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(expression, "all", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder()
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => !result.first().rows.any());
        return query;
    }
    public async deferredAny(predicate?: (item: T) => boolean) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("ANY", hashCode(predicate ? predicate.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            expression.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(expression, "any", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder()
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => result.first().rows.any());
        return query;
    }
    public async deferredFirst(predicate?: (item: T) => boolean) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("FIRST", hashCode(predicate ? predicate.toString() : "", this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate));
            }
            const methodExpression = new MethodCallExpression(expression, "first", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder(),
                resultParser: new this.dbContext.queryParser(commandQuery)
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryCache.resultParser.parse(result, this.dbContext).first());
        return query;
    }
    public async defferedContains(item: T) {
        let n = Date.now();
        let cacheKey = hashCode(this.options.buildKey, hashCode("CONTAINS", hashCode(JSON.stringify(item), this.hashCode())));
        console.log(`cache key: ${cacheKey}; build cache key time: ${Date.now() - n}`);

        n = Date.now();
        const cacheManager = this.dbContext.queryCacheManager;
        let queryCache = cacheManager.get<T>(cacheKey);
        console.log(`is cache found: ${!!queryCache}; find cache time: ${Date.now() - n}`);
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        if (!queryCache) {
            n = Date.now();
            let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
            expression.includes = [];
            const methodExpression = new MethodCallExpression(expression, "contains", [new ValueExpression(item)]);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            console.log(`build query expression time: ${Date.now() - n}`);

            queryCache = {
                commandQuery: commandQuery,
                parameterBuilder: queryBuilder.getParameterBuilder()
            };
            cacheManager.set(cacheKey, queryCache);
        }

        n = Date.now();
        const params = queryCache.parameterBuilder.getSqlParameters(this.options.parameters);
        const queryCommands = queryCache.commandQuery.toQueryCommands(queryBuilder);
        console.log(`build query time: ${Date.now() - n}`);
        // console.log(`query: ${queryCommands.select(o => o.query).toArray().join(";\n")}`);
        // console.log(`parameters: ${JSON.stringify(params)}`);

        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => result.first().rows.any());
        return query;
    }
    public async update(setter: { [key in keyof T]: T[key] }) {
        const entityMeta = Reflect.getOwnMetadata(entityMetaKey, this.type);
        if (!entityMeta) {
            throw new Error(`Only entity typed supported`);
        }
        const queryBuilder = new this.dbContext.queryBuilder();
        queryBuilder.options = this.options;
        let expression = this.buildQuery(queryBuilder) as SelectExpression<T>;
        const query = expression.toString(queryBuilder);
        return query as any;
    }
    public async delete(predicate?: (item: T) => boolean, forceHardDelete = false) {
        const entityMeta = Reflect.getOwnMetadata(entityMetaKey, this.type);
        if (!entityMeta) {
            throw new Error(`Only entity typed supported`);
        }
        // delete code here.
    }
}
