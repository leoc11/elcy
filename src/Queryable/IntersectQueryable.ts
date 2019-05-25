import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class IntersectQueryable<T> extends Queryable<T> {
    public get parameters() {
        if (!this._parameters) {
            this._parameters = {};
            Object.assign(this._parameters, this.parent2.parameters);
            Object.assign(this._parameters, this.parent.parameters);
        }
        return this._parameters;
    }
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type, parent);
    }
    private _parameters: { [key: string]: any };
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const childOperand = this.parent2.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "intersect", [childOperand]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return  queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public flatQueryParameter(param?: { index: number }) {
        const flatParam = this.parent.flatQueryParameter(param);
        const flatParam2 = this.parent2.flatQueryParameter(param);
        Object.assign(flatParam, flatParam2);
        return flatParam;
    }
    public hashCode() {
        return hashCode("INTERSECT", this.parent.hashCode() + this.parent2.hashCode());
    }
}
