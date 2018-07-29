import { GenericType } from "../Common/Type";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { IVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IBuildResult } from "./IBuildResult";

export class IncludeQueryable<T> extends Queryable<T> {
    protected readonly selectorsFn: Array<(item: T) => any>;
    private _selectors: Array<FunctionExpression<T, any>>;
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.select((o) => ExpressionBuilder.parse(o)).toArray();
        }

        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, selectors: Array<((item: T) => any)> | Array<FunctionExpression<T, any>>, public type: GenericType<T> = Object) {
        super(type, parent);
        if (selectors.length > 0 && selectors[0] instanceof FunctionExpression) {
            this.selectors = selectors as any;
        }
        else {
            this.selectorsFn = selectors as any;
        }
    }
    public buildQuery(queryBuilder: QueryBuilder): IBuildResult<T> {
        const buildResult = this.parent.buildQuery(queryBuilder);
        const objectOperand = buildResult.expression;
        const methodExpression = new MethodCallExpression(objectOperand, "include", this.selectors);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, sqlParameters: buildResult.sqlParameters, scope: "queryable" };
        buildResult.expression = queryBuilder.visit(methodExpression, visitParam) as any;
        return buildResult;
    }
    public hashCode(): number {
        return hashCode("INCLUDE", this.parent.hashCode() + ((this.selectorsFn || this.selectors) as any[])
            .select((o) => hashCode(o.toString()))
            .sum());
    }
}
