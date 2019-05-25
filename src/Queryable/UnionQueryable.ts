import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class UnionQueryable<T> extends Queryable<T> {
    public get parameters() {
        if (!this._parameters) {
            this._parameters = {};
            Object.assign(this._parameters, this.parent2.parameters);
            Object.assign(this._parameters, this.parent.parameters);
        }
        return this._parameters;
    }
    constructor(parent: Queryable<T>, parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type, parent);
        this.parent2 = parent2.parameter({ union: isUnionAll });
    }
    protected readonly parent2: Queryable<T>;
    private _parameters: { [key: string]: any };
    public buildQuery(queryVisitor: IQueryVisitor) {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const childOperand = this.parent2.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "union", [childOperand, new ParameterExpression("union", Boolean)]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const resut = queryVisitor.visit(methodExpression, visitParam) as any;
        return resut;
    }
    public flatQueryParameter(param?: { index: number }) {
        const flatParam = this.parent.flatQueryParameter(param);
        const flatParam2 = this.parent2.flatQueryParameter(param);
        Object.assign(flatParam, flatParam2);
        return flatParam;
    }
    public hashCode() {
        return hashCode("UNION", this.parent.hashCode() + this.parent2.hashCode());
    }
}
