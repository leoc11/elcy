import { MethodKey, ValueType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class ProjectQueryable<T> extends Queryable<T> {
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.map((o) => ExpressionBuilder.parse(o, [this.parent.type], this.parameters));
        }

        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public override readonly parent: Queryable<T>, selectors: Array<((item: T) => ValueType)> | FunctionExpression<ValueType, [T]>[]) {
        super(parent.type, parent);
        if (selectors.length > 0 && selectors[0] instanceof FunctionExpression) {
            this.selectors = selectors as FunctionExpression<ValueType, [T]>[];
        }
        else {
            this.selectorsFn = selectors as Array<((item: T) => ValueType)>;
        }
    }
    protected readonly selectorsFn: Array<(item: T) => ValueType>;
    private _selectors: FunctionExpression<ValueType, [T]>[];
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const selectors = this.selectors.map((o) => o.clone());
        const methodExpression = new MethodCallExpression(objectOperand, "project" as MethodKey<T[]>, selectors);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand as SelectExpression, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode(): number {
        return hashCodeAdd(hashCode("PROJECT", this.parent.hashCode()), this.selectors.reduce((r, o) => r + o.hashCode(), 0));
    }
}
