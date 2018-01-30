import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression, JoinEntityExpression } from "./QueryExpression/index";

export class WhereQueryable<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    protected readonly predicate: FunctionExpression<T, boolean>;
    constructor(public readonly parent: Queryable<T>, predicate: FunctionExpression<T, boolean> | ((item: T) => boolean)) {
        super(parent.type);
        this.predicate = predicate instanceof FunctionExpression ? predicate : ExpressionFactory.prototype.ToExpression<T, boolean>(predicate, parent.type);
    }
    public buildQuery(queryBuilder?: QueryBuilder): any {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;
            this.expression = new SelectExpression(this.parent.buildQuery(queryBuilder) as any);
            const entity = this.expression.entity instanceof JoinEntityExpression ? this.expression.entity.masterEntity : this.expression.entity;
            const methodExpression = new MethodCallExpression(entity, "where", [this.predicate]);
            const param = { parent: this.expression, type: "where" };
            queryBuilder.visit(methodExpression, param as any);
            this.expression = param.parent;
        }
        return this.expression;
    }
}
