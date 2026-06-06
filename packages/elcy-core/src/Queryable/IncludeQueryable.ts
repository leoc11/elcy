import { Enumerable } from "@elcy/enumerable";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitContext } from "../Query/IQueryVisitContext";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { MethodKey, ValueType } from "src/Common/Type";

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
    constructor(public override readonly parent: Queryable<T>, selectors: Array<((item: T) => Exclude<object, ValueType>)> | FunctionExpression<Exclude<object, ValueType>, [T]>[]) {
        super(parent.type, parent as Queryable);
        if (selectors.length > 0 && selectors[0] instanceof FunctionExpression) {
            this.selectors = selectors as any;
        }
        else {
            this.selectorsFn = selectors as any;
        }
    }
    protected readonly selectorsFn: Array<(item: T) => Exclude<object, ValueType>>;
    private _selectors: FunctionExpression<Exclude<object, ValueType>, [T]>[];
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const methodExpression = new MethodCallExpression(objectOperand, "withRelated" as MethodKey<T[]>, this.selectors);
        const context: IQueryVisitContext = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, context) as any;
    }
    public hashCode(): number {
        return hashCodeAdd(hashCode("WITHRELATED", this.parent.hashCode()), Enumerable.from(this.selectors).sum((o) => o.hashCode()));
    }
}
