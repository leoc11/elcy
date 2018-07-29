import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { IVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { IBuildResult } from "./IBuildResult";

export class IntersectQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type, parent);
        this.option(this.parent2.options);
    }
    public buildQuery(queryBuilder: QueryBuilder): IBuildResult<T> {
        const buildResult = this.parent.buildQuery(queryBuilder);
        const objectOperand = buildResult.expression;
        const buildResult2 = this.parent2.buildQuery(queryBuilder);
        const childOperand = buildResult2.expression;
        buildResult.sqlParameters = buildResult.sqlParameters.concat(buildResult2.sqlParameters);
        const methodExpression = new MethodCallExpression(objectOperand, "intersect", [childOperand]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
        buildResult.expression = queryBuilder.visit(methodExpression, visitParam) as any;
        return buildResult;
    }
    public hashCode() {
        return hashCode("INTERSECT", this.parent.hashCode() + this.parent2.hashCode());
    }
}
