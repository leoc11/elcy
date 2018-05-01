import { GenericType } from "../Common/Type";
import { MethodCallExpression, ValueExpression } from "../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/index";
import { DbContext } from "../Data/DBContext";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IQueryResultParser } from "../QueryBuilder/ResultParser/IQueryResultParser";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { ParameterBuilder } from "../QueryBuilder/ParameterBuilder/ParameterBuilder";
import { IQueryCommand } from "../QueryBuilder/Interface/IQueryCommand";

export abstract class Queryable<T = any> {
    public get queryBuilder(): QueryBuilder {
        if (!this._queryBuilder) {
            this._queryBuilder = this.parent.queryBuilder;
            this._queryBuilder.addParameters(this.parameters);
        }
        return this._queryBuilder;
    }
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    public parameters: { [key: string]: any } = {};
    public setParameters(params: { [key: string]: any }) {
        if (!this.parameters)
            this.parameters = {};
        Object.assign(this.parameters, params);
        return this;
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        console.log("query time: " + (Date.now() - n));
        n = Date.now();
        const result = queryParser.parse(queryResult, this.dbContext);
        console.log("parse time: " + (Date.now() - n));
        return result;
    }
    public async count() {
        let key = this.hashCode() + hashCode("COUNT");
        const queryCache = await this.dbContext.getQueryChache<number>(key);
        let queryParser: IQueryResultParser<number>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const methodExpression = new MethodCallExpression(expression, "count", []);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return queryParser.parse(queryResult, this.dbContext).first();
    }
    public async contains(item: T): Promise<boolean> {
        let key = this.hashCode() + hashCode("CONTAINS") + hashCode(JSON.stringify(item));
        const queryCache = await this.dbContext.getQueryChache<boolean>(key);
        let queryParser: IQueryResultParser<boolean>;
        let queryCommands: IQueryCommand[];
        let parameterBuilder: ParameterBuilder;
        if (!queryCache) {
            const queryBuilder = this.queryBuilder;
            let expression = this.buildQuery(queryBuilder).clone() as SelectExpression;
            expression.includes = [];
            const methodExpression = new MethodCallExpression(expression, "contains", [new ValueExpression(item)]);
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
            queryBuilder.visit(methodExpression, param);
            const commandQuery = param.commandExpression;
            queryCommands = [{
                query: queryBuilder.getContainsString(expression)
            }];
            queryParser = new this.dbContext.queryParser(expression);
            parameterBuilder = new ParameterBuilder(queryBuilder.sqlParameterBuilderItems);
            this.dbContext.setQueryChache(key, queryCommands, queryParser, parameterBuilder);
        }
        else {
            queryParser = queryCache.queryParser;
            queryCommands = queryCache.queryCommands;
            parameterBuilder = queryCache.parameterBuilder;
        }
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return queryParser.parse(queryResult, this.dbContext).first();
    }
    public async sum(selector?: (item: T) => number) {
        let key = this.hashCode() + hashCode("SUM");
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
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return queryParser.parse(queryResult, this.dbContext).first();
    }
    public async max(selector?: (item: T) => number) {
        let key = this.hashCode() + hashCode("MAX");
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
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return queryParser.parse(queryResult, this.dbContext).first();
    }
    public async min(selector?: (item: T) => number) {
        let key = this.hashCode() + hashCode("MIN");
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
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return queryParser.parse(queryResult, this.dbContext).first();
    }
    public async avg(selector?: (item: T) => number): Promise<number> {
        let key = this.hashCode() + hashCode("AVG");
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
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return queryParser.parse(queryResult, this.dbContext).first();
    }
    public async all(predicate: (item: T) => boolean): Promise<boolean> {
        let key = this.hashCode() + hashCode("ALL") + hashCode(predicate.toString());
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
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return !queryResult.first().rows.any();
    }
    public async any(predicate?: (item: T) => boolean): Promise<boolean> {
        let key = this.hashCode() + hashCode("ANY");
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
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return queryResult.first().rows.any();
    }
    public async first(predicate?: (item: T) => boolean): Promise<T> {
        let key = this.hashCode() + hashCode("FIRST");
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
            const param: IQueryVisitParameter = { commandExpression: expression, scope: methodExpression.methodName };
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
        const params = parameterBuilder.getSqlParameters(this.parameters);
        const queryResult = await this.dbContext.executeCommands(queryCommands, params);
        return queryParser.parse(queryResult, this.dbContext).first();
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
}
