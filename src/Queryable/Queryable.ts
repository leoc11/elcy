import { GenericType } from "../Common/Type";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { DbContext } from "../Data/DBContext";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IQueryResultParser } from "../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { ParameterBuilder } from "../QueryBuilder/ParameterBuilder/ParameterBuilder";
import { IQueryCommand } from "../QueryBuilder/Interface/IQueryCommand";
import { DeferredQuery } from "../QueryBuilder/DeferredQuery";
import { IQueryOption } from "../QueryBuilder/Interface/ISelectQueryOption";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";

export abstract class Queryable<T = any> {
    public get queryBuilder(): QueryBuilder {
        if (!this._queryBuilder) {
            this._queryBuilder = this.parent.queryBuilder;
            this._queryBuilder.addParameters(this.options.userParameters);
        }
        return this._queryBuilder;
    }
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    public options: IQueryOption = { userParameters: {} };
    public setParameters(params: { [key: string]: any }) {
        Object.assign(this.options.userParameters, params);
        return this;
    }
    public setOption(option: IQueryOption) {
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
    }
    protected expression: ICommandQueryExpression<T>;
    protected parent: Queryable;
    private _queryBuilder: QueryBuilder;
    constructor(public type: GenericType<T>, parent?: Queryable) {
        if (parent) {
            this.parent = parent;
            this.setOption(this.parent.options);
        }
    }
    public buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<T> {
        return this.expression;
    }
    public abstract hashCode(): number;
    public toString() {
        return this.buildQuery(this.queryBuilder).toString(this.queryBuilder);
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
        const key = this.parameterHasCode() + this.hashCode();
        console.log("query cache key: " + key);
        let n = Date.now();
        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            const commandQuery = this.buildQuery(queryBuilder);
            console.log("over head: " + (Date.now() - n));
            n = Date.now();
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            console.log("over head: " + (Date.now() - n));
            queryParser = new this.dbContext.queryParser(commandQuery);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        n = Date.now();
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        console.log("Query:\n" + queryCommands.select(o => o.query).toArray().join(";\n"));
        console.log("parameters");
        console.log(params);
        const query = new DeferredQuery(this.dbContext, queryCommands, params, (result) => queryParser.parse(result, this.dbContext));
        return query;
    }
    public async defferedCount() {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("COUNT");
        const queryCache = await this.dbContext.getQueryChache<number>(key);
        let queryParser: IQueryResultParser<number>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const methodExpression = new MethodCallExpression(expression, "count", []);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        const query = new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryParser.parse(result, this.dbContext).first());
        return query;
    }
    public async deferredSum(selector?: (item: T) => number) {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("SUM");
        if (selector)
            key += hashCode(selector.toString());

        const queryCache = await this.dbContext.getQueryChache<number>(key);
        let queryParser: IQueryResultParser<number>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression, "sum", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        return new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryParser.parse(result, this.dbContext).first());
    }
    public async deferredMax(selector?: (item: T) => number) {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("MAX");
        if (selector)
            key += hashCode(selector.toString());

        const queryCache = await this.dbContext.getQueryChache<number>(key);
        let queryParser: IQueryResultParser<number>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression, "max", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        return new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryParser.parse(result, this.dbContext).first());
    }
    public async deferredMin(selector?: (item: T) => number) {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("MIN");
        if (selector)
            key += hashCode(selector.toString());

        const queryCache = await this.dbContext.getQueryChache<number>(key);
        let queryParser: IQueryResultParser<number>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression, "min", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        return new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryParser.parse(result, this.dbContext).first());
    }
    public async deferredAvg(selector?: (item: T) => number) {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("AVG");
        if (selector)
            key += hashCode(selector.toString());

        const queryCache = await this.dbContext.getQueryChache<number>(key);
        let queryParser: IQueryResultParser<number>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression, "avg", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        return new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryParser.parse(result, this.dbContext).first());
    }
    public async deferredAll(predicate: (item: T) => boolean) {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("ALL") + hashCode(predicate.toString());
        const queryCache = await this.dbContext.getQueryChache<boolean>(key);
        let queryParser: IQueryResultParser<boolean>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression, "all", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        return new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => !result.first().rows.any());
    }
    public async deferredAny(predicate?: (item: T) => boolean) {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("ANY");
        if (predicate)
            key += hashCode(predicate.toString());

        const queryCache = await this.dbContext.getQueryChache<boolean>(key);
        let queryParser: IQueryResultParser<boolean>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression, "any", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        return new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => result.first().rows.any());
    }
    public async deferredFirst(predicate?: (item: T) => boolean) {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("FIRST");
        if (predicate)
            key += hashCode(predicate.toString());

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression, "first", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        return new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryParser.parse(result, this.dbContext).first());
    }
    public async defferedContains(item: T) {
        let key = this.parameterHasCode() + this.hashCode() + hashCode("CONTAINS") + hashCode(JSON.stringify(item));
        const queryCache = await this.dbContext.getQueryChache<boolean>(key);
        let queryParser: IQueryResultParser<boolean>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const methodExpression = new MethodCallExpression(expression, "contains", [new ValueExpression(item)]);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: "queryable" };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = commandQuery.toQueryCommands(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.options.userParameters);
        return new DeferredQuery(this.dbContext, queryCommands, params,
            (result) => queryParser.parse(result, this.dbContext).any());
    }
    public async update(setter: { [key in keyof T]: T[key] }) {
        const entityMeta = Reflect.getOwnMetadata(entityMetaKey, this.type);
        if (!entityMeta) {
            throw new Error(`Only entity typed supported`);
        }
        const queryBuilder = this.queryBuilder;
        let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
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
    private parameterHasCode() {
        let result = 0;
        for (const prop in this.options.userParameters) {
            const value = this.options.userParameters[prop];
            if (typeof value === "function") {
                result += hashCode(value.toString());
            }
        }
        return result;
    }
}
