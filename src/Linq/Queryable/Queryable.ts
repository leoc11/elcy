import { GenericType } from "../../Common/Type";
import { MethodCallExpression, ValueExpression } from "../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/index";
import { DbContext } from "../DBContext";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { IQueryResultParser } from "../../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryVisitParameter } from "../QueryExpressionVisitor";
import { hashCode } from "../../Helper/Util";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";

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
    public abstract hashCode(): number;
    public toString() {
        return this.buildQuery(this.queryBuilder).toString(this.queryBuilder);
    }
    public async toArray(): Promise<T[]> {
        const key = this.hashCode();
        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            const n = Date.now();
            const commandQuery = this.buildQuery(queryBuilder);
            queryStr = commandQuery.toString(queryBuilder);
            console.log("over head: " + (Date.now() - n));
            queryParser = new this.dbContext.queryParser(commandQuery);
            this.dbContext.setQueryChache(key, queryStr, queryParser);

            // TODO: remove this. this is only for debug purphose.
            this.hashCode();
        }
        else {
            queryParser = queryCache.queryParser;
            queryStr = queryCache.query;
        }
        const n = Date.now();
        const queryResult = await this.dbContext.executeQuery(queryStr);
        console.log("query time: " + (Date.now() - n));
        return queryParser.parse(queryResult, this.dbContext);
    }
    public async count() {
        let key = this.hashCode() + hashCode("COUNT");
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public async contains(item: T) {
        let key = this.hashCode() + hashCode("CONTAINS") + hashCode(JSON.stringify(item));
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public async sum(selector?: (item: T) => number) {
        let key = this.hashCode() + hashCode("SUM");
        if (selector)
            key += hashCode(selector.toString());

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector, [this.type]));
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public async max(selector?: (item: T) => number) {
        let key = this.hashCode() + hashCode("MAX");
        if (selector)
            key += hashCode(selector.toString());

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector, [this.type]));
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public async min(selector?: (item: T) => number) {
        let key = this.hashCode() + hashCode("MIN");
        if (selector)
            key += hashCode(selector.toString());

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "min", metParams);
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public async avg(selector?: (item: T) => number): Promise<number> {
        let key = this.hashCode() + hashCode("AVG");
        if (selector)
            key += hashCode(selector.toString());

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (selector) {
                metParams.push(ExpressionBuilder.parse<T, number>(selector, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "avg", metParams);
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public async all(predicate: (item: T) => boolean) {
        let key = this.hashCode() + hashCode("ALL") + hashCode(predicate.toString());
        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "all", metParams);
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public async any(predicate?: (item: T) => boolean) {
        let key = this.hashCode() + hashCode("ANY");
        if (predicate)
            key += hashCode(predicate.toString());

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "any", metParams);
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public async first(predicate?: (item: T) => boolean): Promise<T> {
        let key = this.hashCode() + hashCode("FIRST");
        if (predicate)
            key += hashCode(predicate.toString());

        const queryCache = await this.dbContext.getQueryChache<T>(key);
        let queryParser: IQueryResultParser<T>;
        let queryStr: string;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
            const metParams = [];
            if (predicate) {
                metParams.push(ExpressionBuilder.parse<T, boolean>(predicate, [this.type]));
            }
            const methodExpression = new MethodCallExpression(expression.entity, "first", metParams);
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
        const result = await this.dbContext.executeQuery(queryStr);
        return result.first().rows.first();
    }
    public update(setter: { [key in keyof T]: T[key] }) {
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
