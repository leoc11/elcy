import type { IQueryVisitor } from "../Query/IQueryVisitor";
import type { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import type { IQueryExpression } from "./QueryExpression/IQueryExpression";
import type { SelectExpression } from "./QueryExpression/SelectExpression";
import type { MethodKey } from "src/Common/Type";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { hashCode } from "../Helper/Util";
import { Queryable } from "./Queryable";

export class UnionQueryable<T> extends Queryable<T> {
    public get parameters() {
        if (!this._parameters) {
            this._parameters = {};
            for (const parent of this.parents) {
                Object.assign(this._parameters, parent.parameters);
            }
        }
        return this._parameters;
    }
    constructor(...parents: [Queryable<T>, Queryable<T>, ...Queryable<T>[]]) {
        const parent = parents[0];
        super(parent.type, parent as Queryable);
        this.parents = parents;
    }
    protected readonly parents: Queryable<T>[];
    private _parameters: { [key: string]: unknown };
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const parentOperands = this.parents.map(o => o.buildQuery(queryVisitor) as SelectExpression<T>);
        const objectOperand = parentOperands[0];
        const childOperands = parentOperands.slice(1);
        const methodExpression = new MethodCallExpression(parentOperands[0], "union" as MethodKey<T[]>, childOperands);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const resut = queryVisitor.visit(methodExpression, visitParam) as IQueryExpression<T>;
        return resut;
    }
    public flatQueryParameter(param?: { index: number }) {
        let flatParam: Record<string, unknown> = {};
        for (const parent of this.parents) {
            Object.assign(flatParam, parent.flatQueryParameter(param));
        }
        return flatParam;
    }
    public hashCode() {
        return hashCode("UNION", this.parents.reduce((r, o) => o.hashCode(), 0));
    }
}
