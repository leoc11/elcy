import { GenericType } from "../../Common/Type";
import { MethodCallExpression, ValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Enumerable } from "../Enumerable";
// import { IGroupArray } from "../Interface/IGroupArray";
import { QueryBuilder } from "../QueryBuilder";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/index";
import { DbContext } from "../DBContext";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { WhereQueryable } from "./index";

export abstract class Queryable<T = any> extends Enumerable<T> {
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
        super();
    }
    public buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<T> {
        return this.expression;
    }
    public toString() {
        return this.buildQuery(this.queryBuilder).toString(this.queryBuilder);
    }
    public toArray(): T[] {
        const query = this.toString();
        return query as any;
    }
    public count(): number {
        const queryBuilder = this.queryBuilder;
        let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
        const methodExpression = new MethodCallExpression(expression.entity, "count", []);
        const param = { parent: expression, type: methodExpression.methodName };
        queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = queryBuilder.getContainsString(expression);
        return query as any;
    }
    public contains(item: T): boolean {
        const queryBuilder = this.queryBuilder;
        let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
        const methodExpression = new MethodCallExpression(expression.entity, "contains", [new ValueExpression(item)]);
        const param = { parent: expression, type: methodExpression.methodName };
        queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = queryBuilder.getContainsString(expression);
        return query as any;
    }
    public sum(selector?: (item: T) => number): number {
        const queryBuilder = this.queryBuilder;
        let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
        const metParams = [];
        if (selector) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
        }
        const methodExpression = new MethodCallExpression(expression, "sum", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(queryBuilder);
        return query as any;
    }
    public max(selector?: (item: T) => number): number {
        const queryBuilder = this.queryBuilder;
        let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
        const metParams = [];
        if (selector) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
        }
        const methodExpression = new MethodCallExpression(expression.entity, "max", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(queryBuilder);
        return query as any;
    }
    public min(selector?: (item: T) => number): number {
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
        const query = expression.toString(queryBuilder);
        return query as any;
    }
    public avg(selector?: (item: T) => number): number {
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
        const query = expression.toString(queryBuilder);
        return query as any;
    }
    public all(predicate: (item: T) => boolean) {
        const queryBuilder = this.queryBuilder;
        let expression = new SelectExpression<any>(this.buildQuery(queryBuilder) as any);
        const metParams = [ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, this.type)];
        const methodExpression = new MethodCallExpression(expression.entity, "all", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(queryBuilder);
        return query as any;
    }
    public any(predicate?: (item: T) => boolean) {
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
        const query = expression.toString(queryBuilder);
        return query as any;
    }
    public first(predicate?: (item: T) => boolean): T {
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
        const query = expression.toString(queryBuilder);
        return query as any;
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
