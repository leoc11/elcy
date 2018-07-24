import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";

export class UnionQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type, parent);
    }
    public buildQuery(queryBuilder: QueryBuilder): ICommandQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryBuilder) as SelectExpression<T>;
        const childOperand = this.parent2.buildQuery(queryBuilder);
        const methodExpression = new MethodCallExpression(objectOperand, "union", [childOperand, new ValueExpression(this.isUnionAll)]);
        const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "queryable" };
        return queryBuilder.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("UNION", this.parent.hashCode() + this.parent2.hashCode());
    }
}
