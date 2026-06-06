import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitContext } from "../Query/IQueryVisitContext";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class WhereQueryable<T> extends Queryable<T> {
    protected get predicate() {
        if (!this._predicate && this.predicateFn) {
            this._predicate = ExpressionBuilder.parse(this.predicateFn, [this.parent.type], this.parameters);
        }
        return this._predicate;
    }
    protected set predicate(value) {
        this._predicate = value;
    }
    constructor(public override readonly parent: Queryable<T>, predicate: FunctionExpression<boolean, [T]> | ((item: T) => boolean)) {
        super(parent.type, parent);
        if (predicate instanceof FunctionExpression) {
            this.predicate = predicate;
        }
        else {
            this.predicateFn = predicate;
        }
    }
    protected _predicate: FunctionExpression<boolean, [T]>;
    protected readonly predicateFn: (item: T) => boolean;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const methodExpression = new MethodCallExpression(objectOperand, "filter", [this.predicate]);
        const context: IQueryVisitContext = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, context) as IQueryExpression<T>;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("FILTER", this.parent.hashCode()), this.predicate.hashCode());
    }
}
