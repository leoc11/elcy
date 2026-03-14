import { Enumerable } from "@elcy/enumerable";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class IncludeQueryable<T> extends Queryable<T> {
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.map((o) => ExpressionBuilder.parse(o, [this.parent.type], this.parameters));
        }

        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, selectors: Array<((item: T) => any)> | FunctionExpression[]) {
        super(parent.type, parent);
        if (selectors.length > 0 && selectors[0] instanceof FunctionExpression) {
            this.selectors = selectors as any;
        }
        else {
            this.selectorsFn = selectors as any;
        }
    }
    protected readonly selectorsFn: Array<(item: T) => any>;
    private _selectors: FunctionExpression[];
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const selectors = this.selectors.map((o) => o.clone());
        const methodExpression = new MethodCallExpression(objectOperand, "loads", selectors);
        const visitParam: IQueryVisitParameter<T> = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode(): number {
        return hashCodeAdd(hashCode("LOADS", this.parent.hashCode()), Enumerable.from(this.selectors).sum((o) => o.hashCode()));
    }
}
