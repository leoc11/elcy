import { GenericType } from "../../Common/Type";
import { MethodCallExpression, ValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Enumerable } from "../Enumerable";
// import { IGroupArray } from "../Interface/IGroupArray";
import { QueryBuilder } from "../QueryBuilder";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";
import { SelectExpression } from "./QueryExpression/index";

export abstract class Queryable<T = any> extends Enumerable<T> {
    public abstract queryBuilder: QueryBuilder;
    protected expression: ICommandQueryExpression<T>;
    protected parent: Queryable;
    constructor(public type: GenericType<T>) {
        super();
    }
    public buildQuery(queryBuilder?: QueryBuilder): ICommandQueryExpression<T> {
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
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const methodExpression = new MethodCallExpression(expression.entity, "count", []);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = this.queryBuilder.getContainsString(expression);
        return query as any;
    }
    public contains(item: T): boolean {
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const methodExpression = new MethodCallExpression(expression.entity, "contains", [new ValueExpression(item)]);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = this.queryBuilder.getContainsString(expression);
        return query as any;
    }
    public sum(selector?: (item: T) => number): number {
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const metParams = [];
        if (selector) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
        }
        const methodExpression = new MethodCallExpression(expression.entity, "sum", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(this.queryBuilder);
        return query as any;
    }
    public max(selector?: (item: T) => number): number {
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const metParams = [];
        if (selector) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
        }
        const methodExpression = new MethodCallExpression(expression.entity, "max", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(this.queryBuilder);
        return query as any;
    }
    public min(selector?: (item: T) => number): number {
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const metParams = [];
        if (selector) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
        }
        const methodExpression = new MethodCallExpression(expression.entity, "min", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(this.queryBuilder);
        return query as any;
    }
    public avg(selector?: (item: T) => number): number {
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const metParams = [];
        if (selector) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, number>(selector, this.type));
        }
        const methodExpression = new MethodCallExpression(expression.entity, "avg", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(this.queryBuilder);
        return query as any;
    }
    public all(predicate?: (item: T) => boolean) {
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const metParams = [];
        if (predicate) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, this.type));
        }
        const methodExpression = new MethodCallExpression(expression.entity, "all", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(this.queryBuilder);
        return query as any;
    }
    public any(predicate?: (item: T) => boolean) {
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const metParams = [];
        if (predicate) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, this.type));
        }
        const methodExpression = new MethodCallExpression(expression.entity, "any", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(this.queryBuilder);
        return query as any;
    }
    public first(predicate?: (item: T) => boolean): T {
        let expression = new SelectExpression<any>(this.buildQuery() as any);
        const metParams = [];
        if (predicate) {
            metParams.push(ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, this.type));
        }
        const methodExpression = new MethodCallExpression(expression.entity, "first", metParams);
        const param = { parent: expression, type: methodExpression.methodName };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = expression.toString(this.queryBuilder);
        return query as any;
    }
}
