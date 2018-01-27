import { GenericType } from "../../Common/Type";
import { MethodCallExpression, ValueExpression } from "../../ExpressionBuilder/Expression/index";
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
    public contains(item: T): boolean {
        let expression = new SelectExpression<any>(this.parent.buildQuery() as any);
        const methodExpression = new MethodCallExpression(expression.entity, "contains", [new ValueExpression(item)]);
        const param = { parent: expression };
        this.queryBuilder.visit(methodExpression, param);
        expression = param.parent;
        const query = this.queryBuilder.getContainsString(expression);
        return query as any;
    }
}
