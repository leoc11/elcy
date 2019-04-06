import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class IncludeQueryable<T> extends Queryable<T> {
    protected readonly selectorsFn: Array<(item: T) => any>;
    private _selectors: Array<FunctionExpression>;
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.select((o) => ExpressionBuilder.parse(o, this.flatParameterStacks)).toArray();
        }

        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, selectors: Array<((item: T) => any)> | Array<FunctionExpression>) {
        super(parent.type, parent);
        if (selectors.length > 0 && selectors[0] instanceof FunctionExpression) {
            this.selectors = selectors as any;
        }
        else {
            this.selectorsFn = selectors as any;
        }
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const selectors = this.selectors.map(o => o.clone());
        const methodExpression = new MethodCallExpression(objectOperand, "include", selectors);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode(): number {
        return hashCodeAdd(hashCode("INCLUDE", this.parent.hashCode()), this.selectors.sum(o => o.hashCode()));
    }
}
