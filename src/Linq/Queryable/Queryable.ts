import { GenericType } from "../../Common/Type";
import { MethodCallExpression, ValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/index";
import { DbContext } from "../DBContext";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { IQueryResultParser } from "../../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryVisitParameter } from "../QueryExpressionVisitor";

export abstract class Queryable<T = any> {
    public get queryBuilder(): QueryBuilder {
        if (!this._queryBuilder)
            this._queryBuilder = this.parent.queryBuilder;
        return this._queryBuilder;
    }
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    protected expression: ICommandQueryExpression<T>;
    protected parent: Queryable;
    private _queryBuilder: QueryBuilder;
    constructor(public type: GenericType<T>) {
    }
    public buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<T> {
        return this.expression;
    }
    public abstract getHashCode(): string;
    public toString() {
        return this.buildQuery(this.queryBuilder).toString(this.queryBuilder);
    }
    public async toArray(): Promise<T[]> {
        const queryCache = await this.dbContext.getQueryChache<T>(this.getHashCode());
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            const commandQuery = this.buildQuery(queryBuilder);
            queryBuilder.optimizeQueryExpression(commandQuery);
            queryStr = commandQuery.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(commandQuery);
            this.dbContext.setQueryChache(this.getHashCode(), queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const queryResult = await this.dbContext.executeRawQuery(queryStr);
        return queryParser.parse(queryResult, this.dbContext);
    }
    public async count() {
        let key = this.getHashCode() + "-CN";
        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(expression.entity, "count", []);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.commandExpression;
            queryStr = expression.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public async contains(item: T) {
        let key = this.getHashCode() + "-CT" + Array.from(JSON.stringify(item)).sum((o) => o.charCodeAt(0));
        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const methodExpression = new MethodCallExpression(expression.entity, "contains", [new ValueExpression(item)]);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.commandExpression;
            queryStr = queryBuilder.getContainsString(expression);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public async sum(selector?: (item: T) => number) {
        let key = this.getHashCode() + "-SUM";
        if (selector)
            key += Array.from(selector.toString()).sum((o) => o.charCodeAt(0));

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
            }
            const methodExpression = new MethodCallExpression(expression, "sum", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.commandExpression;
            queryStr = expression.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public async max(selector?: (item: T) => number) {
        let key = this.getHashCode() + "-MX";
        if (selector)
            key += Array.from(selector.toString()).sum((o) => o.charCodeAt(0));

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "max", metParams);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.commandExpression;
            queryStr = expression.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public async min(selector?: (item: T) => number) {
        let key = this.getHashCode() + "-MN";
        if (selector)
            key += Array.from(selector.toString()).sum((o) => o.charCodeAt(0));

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "min", metParams);
            const param = { parent: expression, type: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.parent;
            queryStr = expression.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public async avg(selector?: (item: T) => number): Promise<number> {
        let key = this.getHashCode() + "-AV";
        if (selector)
            key += Array.from(selector.toString()).sum((o) => o.charCodeAt(0));

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "avg", metParams);
            const param = { parent: expression, type: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.parent;
            queryStr = expression.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public async all(predicate: (item: T) => boolean) {
        let key = this.getHashCode() + "-AL" + Array.from(predicate.toString()).sum((o) => o.charCodeAt(0));
        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, this.type));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "all", metParams);
            const param = { parent: expression, type: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.parent;
            queryStr = expression.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public async any(predicate?: (item: T) => boolean) {
        let key = this.getHashCode() + "-AN";
        if (predicate)
            key += Array.from(predicate.toString()).sum((o) => o.charCodeAt(0));

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, this.type));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "any", metParams);
            const param = { parent: expression, type: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.parent;
            queryStr = expression.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public async first(predicate?: (item: T) => boolean): Promise<T> {
        let key = this.getHashCode() + "-F";
        if (predicate)
            key += Array.from(predicate.toString()).sum((o) => o.charCodeAt(0));

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, this.type));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "first", metParams);
            const param = { parent: expression, type: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            expression = param.parent;
            queryStr = expression.toString(queryBuilder);
            queryParser = new this.dbContext.queryParser(expression);
            this.dbContext.setQueryChache(key, queryStr, queryParser);
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const result = await this.dbContext.executeRawQuery(queryStr);
        return result.first().rows.first();
    }
    public update(setter: {[key in keyof T]: T[key]}) {
        const entityMeta = Reflect.getOwnMetadata(entityMetaKey, this.type);
        if (!entityMeta) {
            throw new Error(`Only entity typed supported`);
        }
        const queryBuilder = this.queryBuilder;
        let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
        const query = expression.toString(queryBuilder);
        return query as any;
    }
    public delete(forceHardDelete = false, predicate?: (item: T) => boolean) {
        // delete code here.
    }
}
