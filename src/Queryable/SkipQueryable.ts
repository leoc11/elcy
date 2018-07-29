import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { hashCode } from "../Helper/Util";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { IBuildResult } from "./IBuildResult";

export class SkipQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, protected readonly quantity: number) {
        super(parent.type, parent);

        const obj: { [key: string]: any } = {};
        obj[this.parameterName] = this.quantity;
        this.parameter(obj);
    }
    public get parameterName() {
        return "__skip" + Math.abs(this.hashCode());
    }
    public buildQuery(queryBuilder: QueryBuilder): IBuildResult<T> {
        const buildResult = this.parent.buildQuery(queryBuilder);
        const objectOperand = buildResult.expression;
        const methodExpression = new MethodCallExpression(objectOperand, "skip", [new ParameterExpression(this.parameterName, Number)]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
        buildResult.expression = queryBuilder.visit(methodExpression, visitParam) as any;
        return buildResult;
    }
    public hashCode() {
        return hashCode("SKIP", this.parent.hashCode());
    }
}
