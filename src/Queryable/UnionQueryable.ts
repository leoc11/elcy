import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { IVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";

export class UnionQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type, parent);
    }
    public buildQuery(queryBuilder: QueryBuilder) {
        const buildResult = this.parent.buildQuery(queryBuilder);
        const objectOperand = buildResult.expression;
        const buildResult2 = this.parent2.buildQuery(queryBuilder);
        const childOperand = buildResult2.expression;
        buildResult.sqlParameters = buildResult.sqlParameters.concat(buildResult2.sqlParameters);
        const methodExpression = new MethodCallExpression(objectOperand, "union", [childOperand, new ValueExpression(this.isUnionAll)]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
        buildResult.expression = queryBuilder.visit(methodExpression, visitParam) as any;
        return buildResult;
    }
    public hashCode() {
        return hashCode("UNION", this.parent.hashCode() + this.parent2.hashCode());
    }
}
